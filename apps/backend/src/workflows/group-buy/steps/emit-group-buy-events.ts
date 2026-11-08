import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/* Emits one event per id (emitEventStep handles a single event only). */
export const emitGroupBuyEventsStep = createStep(
  "emit-group-buy-events",
  async (input: { events: { name: string; ids: string[] }[] }, { container }) => {
    const bus = container.resolve(Modules.EVENT_BUS);
    const list = input.events.flatMap((e) => e.ids.map((id) => ({ name: e.name, data: { id } })));
    if (list.length) await bus.emit(list);
    return new StepResponse(list.length);
  }
);
