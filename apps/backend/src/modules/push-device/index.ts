import { Module } from "@medusajs/framework/utils";
import PushDeviceModuleService from "./service";

export const PUSH_DEVICE_MODULE = "push_device";

export default Module(PUSH_DEVICE_MODULE, { service: PushDeviceModuleService });
