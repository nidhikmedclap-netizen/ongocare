import { buildLegalPage } from "@/lib/legal/render";

const { metadata, Page } = buildLegalPage("bill-of-rights");
export { metadata };
export default Page;
