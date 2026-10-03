import { db } from "@/lib/db";
import type {
  BankInput,
  ModelInput,
  NameOnlyInput,
  VariantInput,
} from "@/lib/masters/schemas";

export async function listBanks() {
  return db.m_bank.findMany({ orderBy: { name: "asc" } });
}

export async function createBank(data: BankInput) {
  const now = new Date();
  return db.m_bank.create({
    data: { ...data, created_at: now, updated_at: now },
  });
}

export async function updateBank(id: number, data: BankInput) {
  return db.m_bank.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

export async function deleteBank(id: number) {
  return db.m_bank.delete({ where: { id } });
}

export async function listBrokers() {
  return db.m_broker.findMany({ orderBy: { name: "asc" } });
}

export async function createBroker(data: NameOnlyInput) {
  const now = new Date();
  return db.m_broker.create({
    data: { ...data, created_at: now, updated_at: now },
  });
}

export async function updateBroker(id: number, data: NameOnlyInput) {
  return db.m_broker.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

export async function deleteBroker(id: number) {
  return db.m_broker.delete({ where: { id } });
}

export async function listCities() {
  return db.m_city.findMany({ orderBy: { name: "asc" } });
}

export async function createCity(data: NameOnlyInput) {
  const now = new Date();
  return db.m_city.create({
    data: { ...data, created_at: now, updated_at: now },
  });
}

export async function updateCity(id: number, data: NameOnlyInput) {
  return db.m_city.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

export async function deleteCity(id: number) {
  return db.m_city.delete({ where: { id } });
}

export async function listCompanies() {
  return db.m_company.findMany({ orderBy: { name: "asc" } });
}

export async function createCompany(data: NameOnlyInput) {
  const now = new Date();
  return db.m_company.create({
    data: { ...data, created_at: now, updated_at: now },
  });
}

export async function updateCompany(id: number, data: NameOnlyInput) {
  return db.m_company.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

export async function deleteCompany(id: number) {
  return db.m_company.delete({ where: { id } });
}

export async function listModels() {
  const rows = await db.m_model.findMany({ orderBy: { name: "asc" } });
  const companies = await db.m_company.findMany();
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  return rows.map((row) => ({
    ...row,
    company_name: companyMap.get(row.company_id) ?? "—",
  }));
}

export async function listModelsByCompany(companyId: number) {
  return db.m_model.findMany({
    where: { company_id: companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function createModel(data: ModelInput) {
  const now = new Date();
  return db.m_model.create({
    data: { ...data, created_at: now, updated_at: now },
  });
}

export async function updateModel(id: number, data: ModelInput) {
  return db.m_model.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

export async function deleteModel(id: number) {
  return db.m_model.delete({ where: { id } });
}

export async function listVariants() {
  const rows = await db.m_variant.findMany({ orderBy: { name: "asc" } });
  const [companies, models] = await Promise.all([
    db.m_company.findMany(),
    db.m_model.findMany(),
  ]);
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));
  const modelMap = new Map(models.map((m) => [m.id, m.name]));

  return rows.map((row) => ({
    ...row,
    company_name: companyMap.get(row.company_id) ?? "—",
    model_name: modelMap.get(row.model_id) ?? "—",
  }));
}

export async function createVariant(data: VariantInput) {
  const now = new Date();
  return db.m_variant.create({
    data: { ...data, created_at: now, updated_at: now },
  });
}

export async function updateVariant(id: number, data: VariantInput) {
  return db.m_variant.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

export async function deleteVariant(id: number) {
  return db.m_variant.delete({ where: { id } });
}
