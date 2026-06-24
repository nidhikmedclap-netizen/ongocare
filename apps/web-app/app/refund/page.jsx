import { buildLegalPage } from "@/lib/legal/render";

const { metadata, Page } = buildLegalPage("refund");
export { metadata };
export default Page;
