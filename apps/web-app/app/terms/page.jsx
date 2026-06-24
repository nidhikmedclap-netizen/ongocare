import { buildLegalPage } from "@/lib/legal/render";

const { metadata, Page } = buildLegalPage("terms");
export { metadata };
export default Page;
