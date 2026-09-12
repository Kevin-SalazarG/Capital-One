import { IsIn } from "class-validator";

export class UpdateRecommendationDto {
  @IsIn(["open", "accepted", "dismissed", "completed"])
  public readonly status!: "open" | "accepted" | "dismissed" | "completed";
}
