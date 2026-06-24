import { buildLegalPage } from "@/lib/legal/render";

const { metadata, Page } = buildLegalPage("california-privacy");
export { metadata };
export default Page;
