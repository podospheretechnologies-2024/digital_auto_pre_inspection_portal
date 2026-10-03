import {
  createCompany,
  deleteCompany,
  listCompanies,
  updateCompany,
} from "@/lib/masters/service";
import { createNameOnlyHandlers } from "@/lib/masters/name-handlers";

export const { GET, POST, PUT, DELETE } = createNameOnlyHandlers({
  label: "Company",
  list: listCompanies,
  create: createCompany,
  update: updateCompany,
  remove: deleteCompany,
});
