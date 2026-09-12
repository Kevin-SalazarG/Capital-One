import { SetMetadata } from "@nestjs/common";

export const PUBLIC_ROUTE_KEY = "colchon:public-route";

export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(PUBLIC_ROUTE_KEY, true);
