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
  deleteDoctorAndData,
} from "@/lib/db/doctors-repository";
export {
  listSecretariesByDoctorId,
  setSecretaryActive,
  deleteSecretary,
} from "@/lib/db/doctors-repository";
