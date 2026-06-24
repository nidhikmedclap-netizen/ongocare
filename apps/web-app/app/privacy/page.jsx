import { buildLegalPage } from "@/lib/legal/render";

const { metadata, Page } = buildLegalPage("privacy");
export { metadata };
export default Page;
