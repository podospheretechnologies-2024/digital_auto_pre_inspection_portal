import {
  createCity,
  deleteCity,
  listCities,
  updateCity,
} from "@/lib/masters/service";
import { createNameOnlyHandlers } from "@/lib/masters/name-handlers";

export const { GET, POST, PUT, DELETE } = createNameOnlyHandlers({
  label: "City",
  list: listCities,
  create: createCity,
  update: updateCity,
  remove: deleteCity,
});
