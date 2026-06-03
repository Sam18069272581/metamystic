import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { buildCorsOrigins } from "./config/cors-origins";
import { ApiExceptionFilter } from "./shared/api-exception.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = Number(config.get<string>("BACKEND_PORT") ?? config.get<string>("PORT") ?? "4000");

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: buildCorsOrigins(process.env),
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(port);
}

void bootstrap();
