import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "y/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/dist/api";
import { TRPCError } from "@trpc/server";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl
  }
}

export const postsRouter = createTRPCRouter({

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient)

    return posts.map((post) => {
      const auther = users.find((user) => user.id === post.authorId)

      if (!auther ) throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Auther fot post not found",
      })      
      return {
        post,
        auther: {
          ...auther,
          username: auther.username,
        }
      };
    })
  }),
});
