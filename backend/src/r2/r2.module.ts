import { Module, Global } from "@nestjs/common";
import { r2ClientProvider, R2_CLIENT } from "./r2.provider";

@Global()
@Module({
  providers: [r2ClientProvider],
  exports: [R2_CLIENT],
})
export class R2Module {}
