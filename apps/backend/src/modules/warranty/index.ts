import { Module } from "@medusajs/framework/utils";
import WarrantyModuleService from "./service";

export const WARRANTY_MODULE = "warranty";

export default Module(WARRANTY_MODULE, { service: WarrantyModuleService });
