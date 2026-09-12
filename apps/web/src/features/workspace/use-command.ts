"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspace } from "@/features/workspace/workspace";
import { ApiError, errorMessage } from "@/lib/api/errors";

export function useCommand<T>(
  execute: (input: T) => Promise<unknown>,
  message: string,
  afterSuccess?: () => void,
) {
  const { organization, isDemo } = useWorkspace();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: T) => {
      if (isDemo) throw new ApiError("DEMO_READ_ONLY", 400);
      return execute(input);
    },
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ["organization", organization.id],
      });
      toast.success(message);
      afterSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
