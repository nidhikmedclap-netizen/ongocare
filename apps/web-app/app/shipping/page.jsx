import { buildLegalPage } from "@/lib/legal/render";

const { metadata, Page } = buildLegalPage("shipping");
export { metadata };
export default Page;
