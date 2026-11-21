import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountMailService } from './account-mail.service';
import { JwtService } from './jwt.service';
import { AuditModule } from '../audit/audit.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Global()
@Module({
  imports: [AuditModule, WebhooksModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, AccountMailService],
  exports: [JwtService],
})
export class AuthModule {}
