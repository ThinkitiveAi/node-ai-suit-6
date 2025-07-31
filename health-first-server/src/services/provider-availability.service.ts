import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as moment from "moment-timezone";
import {
  ProviderAvailability,
  ProviderAvailabilityDocument,
  SlotStatus,
  AppointmentType,
  RecurrencePattern,
} from "../models/provider-availability.model";
import {
  AppointmentSlot,
  AppointmentSlotDocument,
} from "../models/appointment-slot.model";
import { Provider, ProviderDocument } from "../models/provider.model";
import {
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
  GetAvailabilityQueryDto,
  SearchAvailabilityQueryDto,
  DeleteAvailabilityQueryDto,
} from "../dtos/provider-availability.dto";
import { AvailabilityUtils } from "../utils/availability.utils";

@Injectable()
export class ProviderAvailabilityService {
  private readonly logger = new Logger(ProviderAvailabilityService.name);

  constructor(
    @InjectModel(ProviderAvailability.name)
    private availabilityModel: Model<ProviderAvailabilityDocument>,
    @InjectModel(AppointmentSlot.name)
    private appointmentSlotModel: Model<AppointmentSlotDocument>,
    @InjectModel(Provider.name)
    private providerModel: Model<ProviderDocument>,
    private availabilityUtils: AvailabilityUtils
  ) {}

  /**
   * Create availability slots for a provider
   * @param providerId - Provider ID
   * @param createDto - Availability creation data
   * @returns Creation result
   */
  async createAvailability(
    providerId: string,
    createDto: CreateAvailabilityDto
  ): Promise<any> {
    try {
      // Validate provider exists
      const provider = await this.providerModel.findById(providerId);
      if (!provider) {
        throw new HttpException(
          {
            success: false,
            message: "Provider not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Validate input data
      this.validateAvailabilityInput(createDto);

      // Check for conflicts with existing availability
      await this.checkForConflicts(providerId, createDto);

      const availabilitySlots: ProviderAvailabilityDocument[] = [];
      const appointmentSlots: AppointmentSlotDocument[] = [];

      if (
        createDto.is_recurring &&
        createDto.recurrence_pattern &&
        createDto.recurrence_end_date
      ) {
        // Handle recurring availability
        const dates = this.availabilityUtils.generateRecurringDates(
          createDto.date,
          createDto.recurrence_end_date,
          createDto.recurrence_pattern
        );

        for (const date of dates) {
          const availability = await this.createSingleAvailability(
            providerId,
            { ...createDto, date },
            availabilitySlots
          );
        }
      } else {
        // Handle single availability
        const availability = await this.createSingleAvailability(
          providerId,
          createDto,
          availabilitySlots
        );
      }

      // Save all availability slots first
      const savedAvailabilities = await this.availabilityModel.insertMany(
        availabilitySlots
      );

      // Now generate appointment slots for each saved availability
      for (const savedAvailability of savedAvailabilities) {
        const slots = await this.generateAppointmentSlots(
          savedAvailability,
          []
        );
        appointmentSlots.push(...slots);
      }

      // Save all appointment slots
      const savedAppointmentSlots = await this.appointmentSlotModel.insertMany(
        appointmentSlots
      );

      const totalSlots = savedAppointmentSlots.length;
      const dateRange = {
        start: createDto.date,
        end: createDto.recurrence_end_date || createDto.date,
      };

      this.logger.log(
        `Created ${totalSlots} availability slots for provider ${providerId}`
      );

      return {
        success: true,
        message: "Availability slots created successfully",
        data: {
          availability_id: savedAvailabilities[0]?._id.toString(),
          slots_created: totalSlots,
          date_range: dateRange,
          total_appointments_available: totalSlots,
        },
      };
    } catch (error) {
      this.logger.error(
        `Create availability error: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error during availability creation",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get provider availability
   * @param providerId - Provider ID
   * @param query - Query parameters
   * @returns Availability data
   */
  async getProviderAvailability(
    providerId: string,
    query: GetAvailabilityQueryDto
  ): Promise<any> {
    try {
      // Validate provider exists
      const provider = await this.providerModel.findById(providerId);
      if (!provider) {
        throw new HttpException(
          {
            success: false,
            message: "Provider not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Build query
      const filter: any = {
        provider_id: new Types.ObjectId(providerId),
        date: {
          $gte: query.start_date,
          $lte: query.end_date,
        },
      };

      if (query.status) {
        filter.status = query.status;
      }

      if (query.appointment_type) {
        filter.appointment_type = query.appointment_type;
      }

      // Get availability data
      const availabilities = await this.availabilityModel
        .find(filter)
        .sort({ date: 1 });

      // Group by date
      const availabilityByDate = new Map<string, any[]>();
      for (const availability of availabilities) {
        const date = availability.date;
        if (!availabilityByDate.has(date)) {
          availabilityByDate.set(date, []);
        }
        availabilityByDate.get(date)!.push(availability);
      }

      // Get appointment slots for these availabilities
      const availabilityIds = availabilities.map((a) => a._id);
      const appointmentSlots = await this.appointmentSlotModel.find({
        availability_id: { $in: availabilityIds },
      });

      // Build response
      const availability: any[] = [];
      let totalSlots = 0;
      let availableSlots = 0;
      let bookedSlots = 0;
      let cancelledSlots = 0;

      for (const [date, dateAvailabilities] of availabilityByDate) {
        const slots: any[] = [];

        for (const availability of dateAvailabilities) {
          const dateSlots = appointmentSlots.filter((slot) =>
            slot.availability_id.equals(availability._id)
          );

          for (const slot of dateSlots) {
            const slotData = {
              slot_id: slot._id.toString(),
              start_time: this.formatTimeForDisplay(
                slot.slot_start_time,
                query.timezone
              ),
              end_time: this.formatTimeForDisplay(
                slot.slot_end_time,
                query.timezone
              ),
              status: slot.status,
              appointment_type: slot.appointment_type,
              location: availability.location,
              pricing: availability.pricing,
              special_requirements: availability.special_requirements,
            };

            slots.push(slotData);

            // Update counters
            totalSlots++;
            switch (slot.status) {
              case SlotStatus.AVAILABLE:
                availableSlots++;
                break;
              case SlotStatus.BOOKED:
                bookedSlots++;
                break;
              case SlotStatus.CANCELLED:
                cancelledSlots++;
                break;
            }
          }
        }

        availability.push({
          date,
          slots,
        });
      }

      return {
        success: true,
        data: {
          provider_id: providerId,
          availability_summary: {
            total_slots: totalSlots,
            available_slots: availableSlots,
            booked_slots: bookedSlots,
            cancelled_slots: cancelledSlots,
          },
          availability,
        },
      };
    } catch (error) {
      this.logger.error(
        `Get availability error: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error while fetching availability",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update specific availability slot
   * @param slotId - Slot ID
   * @param providerId - Provider ID
   * @param updateDto - Update data
   * @returns Update result
   */
  async updateAvailabilitySlot(
    slotId: string,
    providerId: string,
    updateDto: UpdateAvailabilityDto
  ): Promise<any> {
    try {
      // Find the appointment slot
      const appointmentSlot = await this.appointmentSlotModel.findOne({
        _id: slotId,
        provider_id: new Types.ObjectId(providerId),
      });

      if (!appointmentSlot) {
        throw new HttpException(
          {
            success: false,
            message: "Slot not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Check if slot is already booked
      if (appointmentSlot.status === SlotStatus.BOOKED) {
        throw new HttpException(
          {
            success: false,
            message: "Cannot update booked slot",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Update appointment slot
      const updateData: any = {};

      if (updateDto.status) {
        updateData.status = updateDto.status;
      }

      if (updateDto.start_time || updateDto.end_time) {
        // Update time slots - this would require more complex logic
        // For now, we'll just update the status
        this.logger.warn("Time updates not implemented yet");
      }

      const updatedSlot = await this.appointmentSlotModel.findByIdAndUpdate(
        slotId,
        updateData,
        { new: true }
      );

      // Update corresponding availability if needed
      if (updateDto.notes || updateDto.pricing) {
        await this.availabilityModel.findByIdAndUpdate(
          appointmentSlot.availability_id,
          {
            ...(updateDto.notes && { notes: updateDto.notes }),
            ...(updateDto.pricing && { pricing: updateDto.pricing }),
          }
        );
      }

      return {
        success: true,
        message: "Slot updated successfully",
        data: {
          slot_id: updatedSlot._id.toString(),
          status: updatedSlot.status,
        },
      };
    } catch (error) {
      this.logger.error(`Update slot error: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error while updating slot",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete availability slot
   * @param slotId - Slot ID
   * @param providerId - Provider ID
   * @param query - Query parameters
   * @returns Deletion result
   */
  async deleteAvailabilitySlot(
    slotId: string,
    providerId: string,
    query: DeleteAvailabilityQueryDto
  ): Promise<any> {
    try {
      // Find the appointment slot
      const appointmentSlot = await this.appointmentSlotModel.findOne({
        _id: slotId,
        provider_id: new Types.ObjectId(providerId),
      });

      if (!appointmentSlot) {
        throw new HttpException(
          {
            success: false,
            message: "Slot not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Check if slot is booked
      if (appointmentSlot.status === SlotStatus.BOOKED) {
        throw new HttpException(
          {
            success: false,
            message: "Cannot delete booked slot",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (query.delete_recurring) {
        // Delete all recurring slots
        const availability = await this.availabilityModel.findById(
          appointmentSlot.availability_id
        );
        if (availability && availability.is_recurring) {
          await this.appointmentSlotModel.deleteMany({
            availability_id: appointmentSlot.availability_id,
          });
          await this.availabilityModel.findByIdAndDelete(
            appointmentSlot.availability_id
          );
        }
      } else {
        // Delete only this specific slot
        await this.appointmentSlotModel.findByIdAndDelete(slotId);
      }

      return {
        success: true,
        message: "Slot deleted successfully",
      };
    } catch (error) {
      this.logger.error(`Delete slot error: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error while deleting slot",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search for available slots
   * @param query - Search parameters
   * @returns Search results
   */
  async searchAvailability(query: SearchAvailabilityQueryDto): Promise<any> {
    try {
      // Build search filter
      const filter: any = {
        status: SlotStatus.AVAILABLE,
      };

      if (query.date) {
        filter.date = query.date;
      } else if (query.start_date && query.end_date) {
        filter.date = {
          $gte: query.start_date,
          $lte: query.end_date,
        };
      }

      if (query.appointment_type) {
        filter.appointment_type = query.appointment_type;
      }

      if (query.insurance_accepted !== undefined) {
        filter["pricing.insurance_accepted"] = query.insurance_accepted;
      }

      if (query.max_price) {
        filter["pricing.base_fee"] = { $lte: query.max_price };
      }

      // Get availabilities
      const availabilities = await this.availabilityModel.find(filter);

      // Get provider information
      const providerIds = [
        ...new Set(availabilities.map((a) => a.provider_id)),
      ];
      const providers = await this.providerModel.find({
        _id: { $in: providerIds },
      });

      // Get appointment slots
      const availabilityIds = availabilities.map((a) => a._id);
      const appointmentSlots = await this.appointmentSlotModel.find({
        availability_id: { $in: availabilityIds },
        status: SlotStatus.AVAILABLE,
      });

      // Build results
      const results: any[] = [];
      const searchCriteria: any = {};

      if (query.date) searchCriteria.date = query.date;
      if (query.specialization)
        searchCriteria.specialization = query.specialization;
      if (query.location) searchCriteria.location = query.location;

      // Group by provider
      const providerMap = new Map();
      for (const provider of providers) {
        providerMap.set(provider._id.toString(), {
          id: provider._id.toString(),
          name: `${provider.first_name} ${provider.last_name}`,
          specialization: provider.specialization,
          years_of_experience: provider.years_of_experience,
          rating: 4.8, // This would come from a rating system
          clinic_address: `${provider.clinic_address.street}, ${provider.clinic_address.city}, ${provider.clinic_address.state} ${provider.clinic_address.zip}`,
        });
      }

      for (const availability of availabilities) {
        const provider = providerMap.get(availability.provider_id.toString());
        if (!provider) continue;

        // Filter by specialization if specified
        if (
          query.specialization &&
          !provider.specialization
            .toLowerCase()
            .includes(query.specialization.toLowerCase())
        ) {
          continue;
        }

        // Filter by location if specified
        if (
          query.location &&
          !provider.clinic_address
            .toLowerCase()
            .includes(query.location.toLowerCase())
        ) {
          continue;
        }

        const slots = appointmentSlots.filter((slot) =>
          slot.availability_id.equals(availability._id)
        );

        if (slots.length === 0) continue;

        const availableSlots = slots.map((slot) => ({
          slot_id: slot._id.toString(),
          date: availability.date,
          start_time: this.formatTimeForDisplay(
            slot.slot_start_time,
            query.timezone
          ),
          end_time: this.formatTimeForDisplay(
            slot.slot_end_time,
            query.timezone
          ),
          appointment_type: slot.appointment_type,
          location: availability.location,
          pricing: availability.pricing,
          special_requirements: availability.special_requirements,
        }));

        results.push({
          provider,
          available_slots: availableSlots,
        });
      }

      return {
        success: true,
        data: {
          search_criteria: searchCriteria,
          total_results: results.length,
          results,
        },
      };
    } catch (error) {
      this.logger.error(
        `Search availability error: ${error.message}`,
        error.stack
      );

      throw new HttpException(
        {
          success: false,
          message: "Internal server error while searching availability",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a single availability record
   * @param providerId - Provider ID
   * @param createDto - Availability data
   * @param availabilitySlots - Array to add the availability to
   * @returns Created availability
   */
  private async createSingleAvailability(
    providerId: string,
    createDto: CreateAvailabilityDto,
    availabilitySlots: ProviderAvailabilityDocument[]
  ): Promise<ProviderAvailabilityDocument> {
    const availability = new this.availabilityModel({
      provider_id: new Types.ObjectId(providerId),
      date: createDto.date,
      start_time: createDto.start_time,
      end_time: createDto.end_time,
      timezone: createDto.timezone,
      is_recurring: createDto.is_recurring || false,
      recurrence_pattern: createDto.recurrence_pattern,
      recurrence_end_date: createDto.recurrence_end_date,
      slot_duration: createDto.slot_duration || 30,
      break_duration: createDto.break_duration || 0,
      status: SlotStatus.AVAILABLE,
      max_appointments_per_slot: createDto.max_appointments_per_slot || 1,
      current_appointments: 0,
      appointment_type:
        createDto.appointment_type || AppointmentType.CONSULTATION,
      location: createDto.location,
      pricing: createDto.pricing,
      notes: createDto.notes,
      special_requirements: createDto.special_requirements,
    });

    availabilitySlots.push(availability);
    return availability;
  }

  /**
   * Generate appointment slots for an availability
   * @param availability - Availability record
   * @param appointmentSlots - Array to add slots to
   * @returns Generated appointment slots
   */
  private async generateAppointmentSlots(
    availability: ProviderAvailabilityDocument,
    appointmentSlots: AppointmentSlotDocument[]
  ): Promise<AppointmentSlotDocument[]> {
    const slots: AppointmentSlotDocument[] = [];
    const timeSlots = this.availabilityUtils.generateTimeSlots(
      availability.start_time,
      availability.end_time,
      availability.slot_duration,
      availability.break_duration
    );

    for (const timeSlot of timeSlots) {
      const slotStart = moment.tz(
        `${availability.date}T${timeSlot}:00`,
        availability.timezone
      );
      const slotEnd = slotStart
        .clone()
        .add(availability.slot_duration, "minutes");

      const appointmentSlot = new this.appointmentSlotModel({
        availability_id: availability._id,
        provider_id: availability.provider_id,
        slot_start_time: slotStart.toDate(),
        slot_end_time: slotEnd.toDate(),
        status: SlotStatus.AVAILABLE,
        appointment_type: availability.appointment_type,
        booking_reference: this.availabilityUtils.generateBookingReference(),
      });

      slots.push(appointmentSlot);
    }

    // Don't modify the passed array, just return the new slots
    return slots;
  }

  /**
   * Validate availability input
   * @param createDto - Availability creation data
   */
  private validateAvailabilityInput(createDto: CreateAvailabilityDto): void {
    if (!this.availabilityUtils.isValidDate(createDto.date)) {
      throw new HttpException(
        {
          success: false,
          message: "Invalid date format",
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (!this.availabilityUtils.isValidTime(createDto.start_time)) {
      throw new HttpException(
        {
          success: false,
          message: "Invalid start time format",
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (!this.availabilityUtils.isValidTime(createDto.end_time)) {
      throw new HttpException(
        {
          success: false,
          message: "Invalid end time format",
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      this.availabilityUtils.hasTimeConflict(
        createDto.start_time,
        createDto.end_time,
        createDto.end_time,
        createDto.start_time
      )
    ) {
      throw new HttpException(
        {
          success: false,
          message: "Start time must be before end time",
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (this.availabilityUtils.isPastDate(createDto.date)) {
      throw new HttpException(
        {
          success: false,
          message: "Cannot create availability for past dates",
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      createDto.is_recurring &&
      (!createDto.recurrence_pattern || !createDto.recurrence_end_date)
    ) {
      throw new HttpException(
        {
          success: false,
          message:
            "Recurrence pattern and end date are required for recurring availability",
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Check for conflicts with existing availability
   * @param providerId - Provider ID
   * @param createDto - Availability creation data
   */
  private async checkForConflicts(
    providerId: string,
    createDto: CreateAvailabilityDto
  ): Promise<void> {
    const existingAvailabilities = await this.availabilityModel.find({
      provider_id: new Types.ObjectId(providerId),
      date: createDto.date,
    });

    for (const existing of existingAvailabilities) {
      if (
        this.availabilityUtils.hasTimeConflict(
          existing.start_time,
          existing.end_time,
          createDto.start_time,
          createDto.end_time
        )
      ) {
        throw new HttpException(
          {
            success: false,
            message: "Time conflict with existing availability",
          },
          HttpStatus.CONFLICT
        );
      }
    }
  }

  /**
   * Format time for display in specified timezone
   * @param dateTime - DateTime object
   * @param timezone - Target timezone
   * @returns Formatted time string
   */
  private formatTimeForDisplay(dateTime: Date, timezone?: string): string {
    if (!timezone) {
      return moment(dateTime).format("HH:mm");
    }

    return moment(dateTime).tz(timezone).format("HH:mm");
  }
}
