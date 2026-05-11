/**
 * Doctor accounts live in MongoDB (collection `doctors`).
 * Re-exports keep imports stable: `@/lib/auth/doctor-store`.
 */
export type { DoctorRecord } from "@/lib/db/doctors-repository";
export {
  findDoctorByEmail,
  createDoctor,
  listDoctorsByClinicId,
  listDoctorsAll,
  setDoctorActiveById,
} from "@/lib/db/doctors-repository";
