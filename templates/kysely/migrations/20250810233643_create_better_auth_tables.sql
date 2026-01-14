-- Create "user" table
CREATE TABLE "public"."user" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "emailVerified" boolean NOT NULL,
  "image" text NULL,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "user_email_key" UNIQUE ("email")
);
-- Create "verification" table
CREATE TABLE "public"."verification" (
  "id" text NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp NULL,
  "updatedAt" timestamp NULL,
  PRIMARY KEY ("id")
);
-- Create "account" table
CREATE TABLE "public"."account" (
  "id" text NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL,
  "accessToken" text NULL,
  "refreshToken" text NULL,
  "idToken" text NULL,
  "accessTokenExpiresAt" timestamp NULL,
  "refreshTokenExpiresAt" timestamp NULL,
  "scope" text NULL,
  "password" text NULL,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "organization" table
CREATE TABLE "public"."organization" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "logo" text NULL,
  "createdAt" timestamp NOT NULL,
  "metadata" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "organization_slug_key" UNIQUE ("slug")
);
-- Create "invitation" table
CREATE TABLE "public"."invitation" (
  "id" text NOT NULL,
  "organizationId" text NOT NULL,
  "email" text NOT NULL,
  "role" text NULL,
  "status" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "inviterId" text NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "member" table
CREATE TABLE "public"."member" (
  "id" text NOT NULL,
  "organizationId" text NOT NULL,
  "userId" text NOT NULL,
  "role" text NOT NULL,
  "createdAt" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "session" table
CREATE TABLE "public"."session" (
  "id" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "token" text NOT NULL,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL,
  "ipAddress" text NULL,
  "userAgent" text NULL,
  "userId" text NOT NULL,
  "activeOrganizationId" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "session_token_key" UNIQUE ("token"),
  CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
