import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProviderAvailabilityService } from './provider-availability.service';
import { AvailabilityUtils } from '../utils/availability.utils';
import { 
  ProviderAvailability, 
  ProviderAvailabilityDocument,
  SlotStatus,
  AppointmentType,
  LocationType,
  RecurrencePattern
} from '../models/provider-availability.model';
import { AppointmentSlot, AppointmentSlotDocument } from '../models/appointment-slot.model';
import { Provider, ProviderDocument } from '../models/provider.model';
import { CreateAvailabilityDto } from '../dtos/provider-availability.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProviderAvailabilityService', () => {
  let service: ProviderAvailabilityService;
  let availabilityModel: Model<ProviderAvailabilityDocument>;
  let appointmentSlotModel: Model<AppointmentSlotDocument>;
  let providerModel: Model<ProviderDocument>;
  let availabilityUtils: AvailabilityUtils;

  const mockAvailabilityModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    insertMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockAppointmentSlotModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    insertMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockProviderModel = {
    findById: jest.fn(),
    find: jest.fn(),
  };

  const mockAvailabilityUtils = {
    generateTimeSlots: jest.fn(),
    generateRecurringDates: jest.fn(),
    hasTimeConflict: jest.fn(),
    isValidTime: jest.fn(),
    isValidDate: jest.fn(),
    isPastDate: jest.fn(),
    generateBookingReference: jest.fn(),
    convertTimezone: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderAvailabilityService,
        {
          provide: getModelToken(ProviderAvailability.name),
          useValue: mockAvailabilityModel,
        },
        {
          provide: getModelToken(AppointmentSlot.name),
          useValue: mockAppointmentSlotModel,
        },
        {
          provide: getModelToken(Provider.name),
          useValue: mockProviderModel,
        },
        {
          provide: AvailabilityUtils,
          useValue: mockAvailabilityUtils,
        },
      ],
    }).compile();

    service = module.get<ProviderAvailabilityService>(ProviderAvailabilityService);
    availabilityModel = module.get<Model<ProviderAvailabilityDocument>>(
      getModelToken(ProviderAvailability.name)
    );
    appointmentSlotModel = module.get<Model<AppointmentSlotDocument>>(
      getModelToken(AppointmentSlot.name)
    );
    providerModel = module.get<Model<ProviderDocument>>(
      getModelToken(Provider.name)
    );
    availabilityUtils = module.get<AvailabilityUtils>(AvailabilityUtils);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAvailability', () => {
    const mockProvider = {
      _id: new Types.ObjectId(),
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@clinic.com',
    };

    const mockCreateDto: CreateAvailabilityDto = {
      date: '2024-02-15',
      start_time: '09:00',
      end_time: '17:00',
      timezone: 'America/New_York',
      slot_duration: 30,
      break_duration: 15,
      is_recurring: false,
      appointment_type: AppointmentType.CONSULTATION,
      location: {
        type: LocationType.CLINIC,
        address: '123 Medical Center Dr, New York, NY 10001',
        room_number: 'Room 205'
      },
      pricing: {
        base_fee: 150.00,
        insurance_accepted: true,
        currency: 'USD'
      },
      special_requirements: ['fasting_required', 'bring_insurance_card'],
      notes: 'Standard consultation slots'
    };

    it('should create availability slots successfully', async () => {
      // Mock provider exists
      mockProviderModel.findById.mockResolvedValue(mockProvider);

      // Mock no conflicts
      mockAvailabilityModel.find.mockResolvedValue([]);

      // Mock time slots generation
      mockAvailabilityUtils.generateTimeSlots.mockReturnValue([
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30'
      ]);

      // Mock booking reference generation
      mockAvailabilityUtils.generateBookingReference.mockReturnValue('BK123456');

      // Mock successful saves
      mockAvailabilityModel.insertMany.mockResolvedValue([
        { _id: new Types.ObjectId(), ...mockCreateDto }
      ]);
      mockAppointmentSlotModel.insertMany.mockResolvedValue([
        { _id: new Types.ObjectId(), status: SlotStatus.AVAILABLE }
      ]);

      const result = await service.createAvailability('provider-id', mockCreateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Availability slots created successfully');
      expect(result.data.slots_created).toBe(16);
      expect(mockAvailabilityModel.insertMany).toHaveBeenCalled();
      expect(mockAppointmentSlotModel.insertMany).toHaveBeenCalled();
    });

    it('should throw error when provider not found', async () => {
      mockProviderModel.findById.mockResolvedValue(null);

      await expect(service.createAvailability('invalid-id', mockCreateDto))
        .rejects
        .toThrow(new HttpException({
          success: false,
          message: 'Provider not found'
        }, HttpStatus.NOT_FOUND));
    });

    it('should throw error when there are time conflicts', async () => {
      mockProviderModel.findById.mockResolvedValue(mockProvider);
      mockAvailabilityModel.find.mockResolvedValue([
        { start_time: '10:00', end_time: '11:00' }
      ]);

      await expect(service.createAvailability('provider-id', mockCreateDto))
        .rejects
        .toThrow(new HttpException({
          success: false,
          message: 'Time conflict with existing availability'
        }, HttpStatus.CONFLICT));
    });

    it('should create recurring availability successfully', async () => {
      const recurringDto = {
        ...mockCreateDto,
        is_recurring: true,
        recurrence_pattern: RecurrencePattern.WEEKLY,
        recurrence_end_date: '2024-03-15'
      };

      mockProviderModel.findById.mockResolvedValue(mockProvider);
      mockAvailabilityModel.find.mockResolvedValue([]);
      mockAvailabilityUtils.generateRecurringDates.mockReturnValue([
        '2024-02-15', '2024-02-22', '2024-03-01', '2024-03-08', '2024-03-15'
      ]);
      mockAvailabilityUtils.generateTimeSlots.mockReturnValue([
        '09:00', '09:30', '10:00', '10:30'
      ]);
      mockAvailabilityUtils.generateBookingReference.mockReturnValue('BK123456');

      mockAvailabilityModel.insertMany.mockResolvedValue([
        { _id: new Types.ObjectId() }
      ]);
      mockAppointmentSlotModel.insertMany.mockResolvedValue([
        { _id: new Types.ObjectId() }
      ]);

      const result = await service.createAvailability('provider-id', recurringDto);

      expect(result.success).toBe(true);
      expect(mockAvailabilityUtils.generateRecurringDates).toHaveBeenCalledWith(
        '2024-02-15',
        '2024-03-15',
        'weekly'
      );
    });
  });

  describe('getProviderAvailability', () => {
    const mockQuery = {
      start_date: '2024-02-15',
      end_date: '2024-02-20',
      timezone: 'America/New_York'
    };

    const mockAvailabilities = [
      {
        _id: new Types.ObjectId(),
        date: '2024-02-15',
        start_time: '09:00',
        end_time: '17:00',
        appointment_type: AppointmentType.CONSULTATION,
        location: {
          type: 'clinic',
          address: '123 Medical Center Dr'
        },
        pricing: {
          base_fee: 150.00,
          insurance_accepted: true
        },
        special_requirements: ['bring_insurance_card']
      }
    ];

    const mockAppointmentSlots = [
      {
        _id: new Types.ObjectId(),
        availability_id: mockAvailabilities[0]._id,
        slot_start_time: new Date('2024-02-15T09:00:00Z'),
        slot_end_time: new Date('2024-02-15T09:30:00Z'),
        status: SlotStatus.AVAILABLE,
        appointment_type: AppointmentType.CONSULTATION
      }
    ];

    it('should return provider availability successfully', async () => {
      mockProviderModel.findById.mockResolvedValue({ _id: 'provider-id' });
      mockAvailabilityModel.find.mockResolvedValue(mockAvailabilities);
      mockAppointmentSlotModel.find.mockResolvedValue(mockAppointmentSlots);

      const result = await service.getProviderAvailability('provider-id', mockQuery);

      expect(result.success).toBe(true);
      expect(result.data.provider_id).toBe('provider-id');
      expect(result.data.availability_summary).toBeDefined();
      expect(result.data.availability).toHaveLength(1);
    });

    it('should throw error when provider not found', async () => {
      mockProviderModel.findById.mockResolvedValue(null);

      await expect(service.getProviderAvailability('invalid-id', mockQuery))
        .rejects
        .toThrow(new HttpException({
          success: false,
          message: 'Provider not found'
        }, HttpStatus.NOT_FOUND));
    });
  });

  describe('updateAvailabilitySlot', () => {
    const mockSlot = {
      _id: new Types.ObjectId(),
      provider_id: new Types.ObjectId(),
      availability_id: new Types.ObjectId(),
      status: SlotStatus.AVAILABLE
    };

    const mockUpdateDto = {
      status: SlotStatus.BLOCKED,
      notes: 'Updated consultation time'
    };

    it('should update slot successfully', async () => {
      mockAppointmentSlotModel.findOne.mockResolvedValue(mockSlot);
      mockAppointmentSlotModel.findByIdAndUpdate.mockResolvedValue({
        ...mockSlot,
        status: SlotStatus.BLOCKED
      });

      const result = await service.updateAvailabilitySlot('slot-id', 'provider-id', mockUpdateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Slot updated successfully');
    });

    it('should throw error when slot not found', async () => {
      mockAppointmentSlotModel.findOne.mockResolvedValue(null);

      await expect(service.updateAvailabilitySlot('invalid-id', 'provider-id', mockUpdateDto))
        .rejects
        .toThrow(new HttpException({
          success: false,
          message: 'Slot not found'
        }, HttpStatus.NOT_FOUND));
    });

    it('should throw error when trying to update booked slot', async () => {
      const bookedSlot = { ...mockSlot, status: SlotStatus.BOOKED };
      mockAppointmentSlotModel.findOne.mockResolvedValue(bookedSlot);

      await expect(service.updateAvailabilitySlot('slot-id', 'provider-id', mockUpdateDto))
        .rejects
        .toThrow(new HttpException({
          success: false,
          message: 'Cannot update booked slot'
        }, HttpStatus.BAD_REQUEST));
    });
  });

  describe('deleteAvailabilitySlot', () => {
    const mockSlot = {
      _id: new Types.ObjectId(),
      provider_id: new Types.ObjectId(),
      availability_id: new Types.ObjectId(),
      status: SlotStatus.AVAILABLE
    };

    it('should delete slot successfully', async () => {
      mockAppointmentSlotModel.findOne.mockResolvedValue(mockSlot);
      mockAppointmentSlotModel.findByIdAndDelete.mockResolvedValue(mockSlot);

      const result = await service.deleteAvailabilitySlot('slot-id', 'provider-id', {});

      expect(result.success).toBe(true);
      expect(result.message).toBe('Slot deleted successfully');
    });

    it('should throw error when slot not found', async () => {
      mockAppointmentSlotModel.findOne.mockResolvedValue(null);

      await expect(service.deleteAvailabilitySlot('invalid-id', 'provider-id', {}))
        .rejects
        .toThrow(new HttpException({
          success: false,
          message: 'Slot not found'
        }, HttpStatus.NOT_FOUND));
    });

    it('should throw error when trying to delete booked slot', async () => {
      const bookedSlot = { ...mockSlot, status: SlotStatus.BOOKED };
      mockAppointmentSlotModel.findOne.mockResolvedValue(bookedSlot);

      await expect(service.deleteAvailabilitySlot('slot-id', 'provider-id', {}))
        .rejects
        .toThrow(new HttpException({
          success: false,
          message: 'Cannot delete booked slot'
        }, HttpStatus.BAD_REQUEST));
    });
  });

  describe('searchAvailability', () => {
    const mockQuery = {
      date: '2024-02-15',
      specialization: 'cardiology',
      location: 'New York, NY'
    };

    const mockAvailabilities = [
      {
        _id: new Types.ObjectId(),
        provider_id: new Types.ObjectId(),
        date: '2024-02-15',
        appointment_type: AppointmentType.CONSULTATION,
        location: {
          type: 'clinic',
          address: '123 Medical Center Dr'
        },
        pricing: {
          base_fee: 150.00,
          insurance_accepted: true
        },
        special_requirements: ['bring_insurance_card']
      }
    ];

    const mockProviders = [
      {
        _id: new Types.ObjectId(),
        first_name: 'John',
        last_name: 'Doe',
        specialization: 'Cardiology',
        years_of_experience: 15,
        clinic_address: {
          street: '123 Medical Center Dr',
          city: 'New York',
          state: 'NY',
          zip: '10001'
        }
      }
    ];

    const mockAppointmentSlots = [
      {
        _id: new Types.ObjectId(),
        availability_id: mockAvailabilities[0]._id,
        slot_start_time: new Date('2024-02-15T09:00:00Z'),
        slot_end_time: new Date('2024-02-15T09:30:00Z'),
        status: SlotStatus.AVAILABLE,
        appointment_type: AppointmentType.CONSULTATION
      }
    ];

    it('should return search results successfully', async () => {
      mockAvailabilityModel.find.mockResolvedValue(mockAvailabilities);
      mockProviderModel.find.mockResolvedValue(mockProviders);
      mockAppointmentSlotModel.find.mockResolvedValue(mockAppointmentSlots);

      const result = await service.searchAvailability(mockQuery);

      expect(result.success).toBe(true);
      expect(result.data.total_results).toBe(1);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.search_criteria).toEqual({
        date: '2024-02-15',
        specialization: 'cardiology',
        location: 'New York, NY'
      });
    });

    it('should filter by specialization', async () => {
      const queryWithSpecialization = { ...mockQuery, specialization: 'neurology' };
      mockAvailabilityModel.find.mockResolvedValue(mockAvailabilities);
      mockProviderModel.find.mockResolvedValue([
        { ...mockProviders[0], specialization: 'Neurology' }
      ]);
      mockAppointmentSlotModel.find.mockResolvedValue(mockAppointmentSlots);

      const result = await service.searchAvailability(queryWithSpecialization);

      expect(result.data.total_results).toBe(1);
    });
  });

  describe('timezone handling', () => {
    it('should convert timezone correctly', () => {
      const time = '09:00';
      const fromTimezone = 'America/New_York';
      const toTimezone = 'America/Los_Angeles';
      const date = '2024-02-15';

      mockAvailabilityUtils.convertTimezone.mockReturnValue('06:00');

      const result = availabilityUtils.convertTimezone(time, fromTimezone, toTimezone, date);

      expect(result).toBe('06:00');
      expect(mockAvailabilityUtils.convertTimezone).toHaveBeenCalledWith(
        time, fromTimezone, toTimezone, date
      );
    });
  });

  describe('conflict detection', () => {
    it('should detect time conflicts correctly', () => {
      const start1 = '09:00';
      const end1 = '10:00';
      const start2 = '09:30';
      const end2 = '10:30';

      mockAvailabilityUtils.hasTimeConflict.mockReturnValue(true);

      const result = availabilityUtils.hasTimeConflict(start1, end1, start2, end2);

      expect(result).toBe(true);
      expect(mockAvailabilityUtils.hasTimeConflict).toHaveBeenCalledWith(
        start1, end1, start2, end2
      );
    });

    it('should not detect conflict for non-overlapping times', () => {
      const start1 = '09:00';
      const end1 = '10:00';
      const start2 = '10:00';
      const end2 = '11:00';

      mockAvailabilityUtils.hasTimeConflict.mockReturnValue(false);

      const result = availabilityUtils.hasTimeConflict(start1, end1, start2, end2);

      expect(result).toBe(false);
    });
  });

  describe('slot generation', () => {
    it('should generate time slots correctly', () => {
      const startTime = '09:00';
      const endTime = '10:00';
      const slotDuration = 30;
      const breakDuration = 0;

      const expectedSlots = ['09:00', '09:30'];
      mockAvailabilityUtils.generateTimeSlots.mockReturnValue(expectedSlots);

      const result = availabilityUtils.generateTimeSlots(startTime, endTime, slotDuration, breakDuration);

      expect(result).toEqual(expectedSlots);
      expect(mockAvailabilityUtils.generateTimeSlots).toHaveBeenCalledWith(
        startTime, endTime, slotDuration, breakDuration
      );
    });

    it('should throw error for invalid time range', () => {
      const startTime = '10:00';
      const endTime = '09:00';

      mockAvailabilityUtils.generateTimeSlots.mockImplementation(() => {
        throw new Error('Start time must be before end time');
      });

      expect(() => availabilityUtils.generateTimeSlots(startTime, endTime))
        .toThrow('Start time must be before end time');
    });
  });
}); 