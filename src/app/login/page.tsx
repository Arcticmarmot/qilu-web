"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToastMessage } from "@/components/ui/toast";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useToastMessage(error, "error");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });
      setToken(result.token);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err, "登录失败"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="回到主路径"
      title="登录歧路"
      description="确认身份后继续进入你的写作与路径空间。"
      footer={
        <>
          还没有账户？{" "}
          <Link href="/register" className="text-accent hover:text-accent-strong">
            注册
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "正在进入" : "登录"}
        </Button>
      </form>
    </AuthShell>
  );
}
