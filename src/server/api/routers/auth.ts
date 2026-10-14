import { signupSchema } from "~/lib/validations/auth";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from 'bcryptjs';

const saltRounds = 10;

export const authRouter = createTRPCRouter({
    signup: publicProcedure
        .input(signupSchema)
        .mutation(async ({ctx, input}) => {
            try {
                // Check if user already exists
                const existingUser = await ctx.db.user.findUnique({
                    where: { email: input.email },
                    select: { id: true }
                });

                if (existingUser) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'User already exists'
                    });
                }

                const hashedPass = await bcrypt.hash(input.password, saltRounds);
                
                return await ctx.db.user.create({
                    data: {
                        name: input.name,
                        email: input.email,
                        hashedPassword: hashedPass
                    },
                    // Only select safe fields to return                    
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                });
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occurred',
                    cause: error
                });
            }
        })
});