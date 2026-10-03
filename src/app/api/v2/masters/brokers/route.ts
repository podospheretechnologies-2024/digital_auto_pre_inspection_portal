import {
  createBroker,
  deleteBroker,
  listBrokers,
  updateBroker,
} from "@/lib/masters/service";
import { createNameOnlyHandlers } from "@/lib/masters/name-handlers";

export const { GET, POST, PUT, DELETE } = createNameOnlyHandlers({
  label: "Broker",
  list: listBrokers,
  create: createBroker,
  update: updateBroker,
  remove: deleteBroker,
});
