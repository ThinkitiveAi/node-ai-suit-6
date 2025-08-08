import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  AppointmentSlot,
  AppointmentSlotDocument,
  SlotStatus,
} from "../models/appointment-slot.model";
import { Provider, ProviderDocument } from "../models/provider.model";
import { Patient, PatientDocument } from "../models/patient.model";
import {
  ProviderAvailability,
  ProviderAvailabilityDocument,
} from "../models/provider-availability.model";
import {
  BookAppointmentDto,
  GetPatientAppointmentsQueryDto,
  AppointmentStatus,
  AppointmentDto,
  CancelAppointmentDto,
} from "../dtos/appointment.dto";
import * as moment from "moment-timezone";

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectModel(AppointmentSlot.name)
    private appointmentSlotModel: Model<AppointmentSlotDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(ProviderAvailability.name)
    private availabilityModel: Model<ProviderAvailabilityDocument>
  ) {}

  /**
   * Book an appointment slot
   * @param bookDto - Booking data
   * @returns Booking result
   */
  async bookAppointment(bookDto: BookAppointmentDto): Promise<any> {
    try {
      // Validate patient exists
      const patient = await this.patientModel.findById(bookDto.patient_id);
      if (!patient) {
        throw new HttpException(
          {
            success: false,
            message: "Patient not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Find the appointment slot
      const appointmentSlot = await this.appointmentSlotModel.findById(
        bookDto.slot_id
      );
      if (!appointmentSlot) {
        throw new HttpException(
          {
            success: false,
            message: "Appointment slot not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Check if slot is available
      if (appointmentSlot.status !== SlotStatus.AVAILABLE) {
        throw new HttpException(
          {
            success: false,
            message: "Appointment slot is not available",
          },
          HttpStatus.CONFLICT
        );
      }

      // Check if slot is in the future
      const now = new Date();
      if (appointmentSlot.slot_start_time <= now) {
        throw new HttpException(
          {
            success: false,
            message: "Cannot book appointments in the past",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Get provider information
      const provider = await this.providerModel.findById(
        appointmentSlot.provider_id
      );
      if (!provider) {
        throw new HttpException(
          {
            success: false,
            message: "Provider not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Get availability information
      const availability = await this.availabilityModel.findById(
        appointmentSlot.availability_id
      );
      if (!availability) {
        throw new HttpException(
          {
            success: false,
            message: "Availability not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Update the appointment slot
      const updatedSlot = await this.appointmentSlotModel.findByIdAndUpdate(
        bookDto.slot_id,
        {
          status: SlotStatus.BOOKED,
          patient_id: new Types.ObjectId(bookDto.patient_id),
          appointment_type:
            bookDto.appointment_type || appointmentSlot.appointment_type,
          booking_reference: `BK${Date.now()}${Math.random()
            .toString(36)
            .substring(2, 8)}`.toUpperCase(),
        },
        { new: true }
      );

      // Update availability current appointments count
      await this.availabilityModel.findByIdAndUpdate(
        appointmentSlot.availability_id,
        {
          $inc: { current_appointments: 1 },
        }
      );

      this.logger.log(
        `Appointment booked successfully: ${updatedSlot.booking_reference} for patient ${patient.first_name} ${patient.last_name}`
      );

      return {
        success: true,
        message: "Appointment booked successfully",
        data: {
          appointment_id: updatedSlot._id.toString(),
          booking_reference: updatedSlot.booking_reference,
          slot_id: bookDto.slot_id,
          patient_id: bookDto.patient_id,
        },
      };
    } catch (error) {
      this.logger.error(
        `Book appointment error: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error during appointment booking",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get patient appointments
   * @param patientId - Patient ID
   * @param query - Query parameters
   * @returns Patient appointments
   */
  async getPatientAppointments(
    patientId: string,
    query: GetPatientAppointmentsQueryDto
  ): Promise<any> {
    try {
      // Validate patient exists
      const patient = await this.patientModel.findById(patientId);
      if (!patient) {
        throw new HttpException(
          {
            success: false,
            message: "Patient not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Build filter
      const filter: any = {
        patient_id: new Types.ObjectId(patientId),
      };

      // Add date filters if provided
      if (query.start_date || query.end_date) {
        filter.slot_start_time = {};
        if (query.start_date) {
          filter.slot_start_time.$gte = new Date(query.start_date);
        }
        if (query.end_date) {
          const endDate = new Date(query.end_date);
          endDate.setHours(23, 59, 59, 999);
          filter.slot_start_time.$lte = endDate;
        }
      }

      // Add status filter
      if (query.status) {
        filter.status = query.status;
      }

      // Add appointment type filter
      if (query.appointment_type) {
        filter.appointment_type = query.appointment_type;
      }

      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Get total count
      const total = await this.appointmentSlotModel.countDocuments(filter);

      // Get appointment slots
      const appointmentSlots = await this.appointmentSlotModel
        .find(filter)
        .sort({ slot_start_time: -1 })
        .skip(skip)
        .limit(limit);

      // Build simple appointments response
      const appointments = appointmentSlots.map((slot) => ({
        appointment_id: slot._id.toString(),
        booking_reference: slot.booking_reference,
        date: moment(slot.slot_start_time).format("YYYY-MM-DD"),
        start_time: moment(slot.slot_start_time).format("HH:mm"),
        end_time: moment(slot.slot_end_time).format("HH:mm"),
        status: slot.status,
        appointment_type: slot.appointment_type,
        provider_id: slot.provider_id.toString(),
        availability_id: slot.availability_id.toString(),
        created_at: slot.createdAt,
        updated_at: slot.updatedAt,
      }));

      return {
        success: true,
        data: {
          appointments,
          pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Get patient appointments error: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error while fetching appointments",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cancel an appointment
   * @param appointmentId - Appointment ID
   * @param patientId - Patient ID
   * @param cancelDto - Cancellation data
   * @returns Cancellation result
   */
  async cancelAppointment(
    appointmentId: string,
    patientId: string,
    cancelDto: CancelAppointmentDto
  ): Promise<any> {
    try {
      // Find the appointment slot
      const appointmentSlot = await this.appointmentSlotModel.findOne({
        _id: appointmentId,
        patient_id: new Types.ObjectId(patientId),
      });

      if (!appointmentSlot) {
        throw new HttpException(
          {
            success: false,
            message: "Appointment not found",
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Check if appointment can be cancelled
      if (appointmentSlot.status !== SlotStatus.BOOKED) {
        throw new HttpException(
          {
            success: false,
            message: "Appointment cannot be cancelled",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if appointment is in the future
      const now = new Date();
      if (appointmentSlot.slot_start_time <= now) {
        throw new HttpException(
          {
            success: false,
            message: "Cannot cancel appointments in the past",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Update the appointment slot
      const updatedSlot = await this.appointmentSlotModel.findByIdAndUpdate(
        appointmentId,
        {
          status: SlotStatus.CANCELLED,
          patient_id: null, // Remove patient association
        },
        { new: true }
      );

      // Update availability current appointments count
      await this.availabilityModel.findByIdAndUpdate(
        appointmentSlot.availability_id,
        {
          $inc: { current_appointments: -1 },
        }
      );

      this.logger.log(
        `Appointment cancelled: ${updatedSlot.booking_reference}`
      );

      return {
        success: true,
        message: "Appointment cancelled successfully",
        data: {
          appointment_id: updatedSlot._id.toString(),
          status: AppointmentStatus.CANCELLED,
          cancelled_at: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Cancel appointment error: ${error.message}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: "Internal server error during appointment cancellation",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
