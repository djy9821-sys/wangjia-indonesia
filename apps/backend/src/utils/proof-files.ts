import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/*
  Receipts are uploaded with private access whenever an S3-compatible
  provider is configured (see medusa-config). Their stored file_url is then
  not reachable directly, so API responses replace it with a short-lived
  signed URL. With the local provider the public URL is returned unchanged.
*/
export const receiptsArePrivate = () =>
  Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID);

export async function signProofUrl(
  container: MedusaContainer,
  proof: { file_url?: string | null; file_id?: string | null }
): Promise<string | null> {
  if (!proof.file_id || !receiptsArePrivate()) {
    return proof.file_url ?? null;
  }
  try {
    const fileModule = container.resolve(Modules.FILE);
    // The file module asks the provider for a presigned URL for private files.
    const file = await fileModule.retrieveFile(proof.file_id);
    return file.url;
  } catch (e) {
    container
      .resolve(ContainerRegistrationKeys.LOGGER)
      .warn(`[proof] could not sign ${proof.file_id}: ${(e as Error).message}`);
    return proof.file_url ?? null;
  }
}

/* Mutates a plan / installment tree in place, replacing proof file_url values. */
export async function signProofUrlsIn<T>(container: MedusaContainer, root: T): Promise<T> {
  if (!receiptsArePrivate() || !root) {
    return root;
  }
  const visit = async (node: any): Promise<void> => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const n of node) await visit(n);
      return;
    }
    if (Array.isArray(node.proofs)) {
      for (const p of node.proofs) {
        p.file_url = await signProofUrl(container, p);
      }
    }
    if (Array.isArray(node.installments)) await visit(node.installments);
  };
  await visit(root);
  return root;
}
