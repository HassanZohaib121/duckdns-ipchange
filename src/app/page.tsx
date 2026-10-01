"use client";

import { open } from "@tauri-apps/plugin-shell";
import {
  ExternalLink,
  Globe,
  KeyRound,
  Bell,
  Clock3,
  Settings2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoke } from "@tauri-apps/api/core";

type Status = "idle" | "updating" | "success" | "error";

export default function Home() {
  const [domain, setDomain] = useState("");
  const [token, setToken] = useState("");
  const [interval, setIntervalValue] = useState("5");
  const [notifications, setNotifications] = useState("yes");

  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIpRef = useRef<string | null>(null);

  /*
   * Get the current public IPv4 address.
   */
  const getIpAddress = async (): Promise<string> => {
    const response = await fetch("https://api.ipify.org?format=json");

    if (!response.ok) {
      throw new Error("Unable to determine public IP address.");
    }

    const data: { ip: string } = await response.json();

    if (!data.ip) {
      throw new Error("Public IP address was not returned.");
    }

    return data.ip;
  };

  /*
   * Update DuckDNS with the current public IP.
   */
  const updateDuckDNS = async (
    currentIp: string,
    force = false,
  ): Promise<boolean> => {
    if (!domain.trim()) {
      throw new Error("Please enter your DuckDNS domain.");
    }

    if (!token.trim()) {
      throw new Error("Please enter your DuckDNS token.");
    }

    if (!force && lastIpRef.current === currentIp) {
      console.log("IP has not changed. Skipping DuckDNS update.");
      return false;
    }

    setStatus("updating");
    setStatusMessage("Updating DuckDNS...");

    try {
      const result = await invoke<string>("update_duckdns", {
        domain: domain.trim(),
        token: token.trim(),
        ip: currentIp,
      });

      console.log("DuckDNS response:", result);

      lastIpRef.current = currentIp;

      setStatus("success");
      setStatusMessage(`Updated successfully • ${currentIp}`);

      if (notifications === "yes") {
        console.log(`DuckDNS updated to ${currentIp}`);
      }

      return true;
    } catch (error) {
      console.error("DuckDNS update failed:", error);

      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : String(error));

      return false;
    }
  };

  /*
   * Check the public IP and update DuckDNS if necessary.
   */
  const checkAndUpdate = async (force = false) => {
    try {
      const currentIp = await getIpAddress();

      setIpAddress(currentIp);

      await updateDuckDNS(currentIp, force);
    } catch (error) {
      console.error(error);

      setStatus("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    }
  };

  /*
   * Save settings / start updater.
   */
  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!domain.trim()) {
      setStatus("error");
      setStatusMessage("Please enter your DuckDNS domain.");
      return;
    }

    if (!token.trim()) {
      setStatus("error");
      setStatusMessage("Please enter your DuckDNS token.");
      return;
    }

    // Clear any existing timer.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Immediately check and update.
    await checkAndUpdate(true);

    // Start periodic checking.
    const intervalMs = Number(interval) * 60 * 1000;

    intervalRef.current = setInterval(() => {
      checkAndUpdate(false);
    }, intervalMs);
  };

  /*
   * Cleanup when component is destroyed.
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-muted/30 px-4 py-10">
      <form className="mx-auto w-full max-w-2xl" onSubmit={handleSubmit}>
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Settings2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                DuckDNS Settings
              </h1>

              <p className="text-sm text-muted-foreground">
                Configure your dynamic DNS connection
              </p>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="space-y-6 p-6 sm:p-8">
            {/* Domain */}
            <div className="space-y-2">
              <Label
                htmlFor="domain"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Globe className="h-4 w-4 text-muted-foreground" />
                Domain
              </Label>

              <Input
                type="text"
                id="domain"
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="xxx.duckdns.org"
                className="h-11"
              />

              <p className="text-xs text-muted-foreground">
                Enter the DuckDNS domain you want to keep updated.
              </p>
            </div>

            {/* Token */}
            <div className="space-y-2">
              <Label
                htmlFor="token"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Token
              </Label>

              <Input
                type="password"
                id="token"
                name="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your DuckDNS token"
                className="h-11"
              />

              <p className="text-xs text-muted-foreground">
                Your token is used to authenticate update requests.
              </p>
            </div>

            {/* Options */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Refresh Interval */}
              <div className="space-y-2">
                <Label
                  htmlFor="interval"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  Refresh Interval
                </Label>

                <Select value={interval} onValueChange={setIntervalValue}>
                  <SelectTrigger id="interval" className="h-11 w-full">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="5">Every 5 minutes</SelectItem>

                    <SelectItem value="10">Every 10 minutes</SelectItem>

                    <SelectItem value="15">Every 15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications */}
              <div className="space-y-2">
                <Label
                  htmlFor="notifications"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Update Notifications
                </Label>

                <Select value={notifications} onValueChange={setNotifications}>
                  <SelectTrigger id="notifications" className="h-11 w-full">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="yes">Enabled</SelectItem>

                    <SelectItem value="no">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current IP */}
            <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
              <div>
                <p className="text-sm font-medium">Current Public IP</p>

                <p className="text-xs text-muted-foreground">
                  Your current external IPv4 address
                </p>
              </div>

              <span className="font-mono text-sm font-medium">
                {ipAddress ?? "Checking..."}
              </span>
            </div>

            {/* Status */}
            {status !== "idle" && (
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  status === "error"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : status === "success"
                      ? "border-green-500/30 bg-green-500/10 text-green-600"
                      : "border-primary/30 bg-primary/10 text-primary"
                }`}
              >
                {status === "updating" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {status === "success" && <CheckCircle2 className="h-4 w-4" />}

                {status === "error" && <AlertCircle className="h-4 w-4" />}

                <span>{statusMessage}</span>
              </div>
            )}

            {/* Help */}
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-1 text-sm font-medium">
                Need your DuckDNS settings?
              </p>

              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Open DuckDNS to find your domain and authentication token.
              </p>

              <Button
                type="button"
                variant="ghost"
                className="inline-flex items-center gap-1.5 px-0 text-sm font-medium text-primary hover:bg-transparent hover:underline"
                onClick={() => open("https://www.duckdns.org")}
              >
                Open DuckDNS
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 border-t bg-muted/20 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 px-6"
              onClick={() => {
                setDomain("");
                setToken("");
                setStatus("idle");
                setStatusMessage("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="h-10 px-7"
              disabled={status === "updating"}
            >
              {status === "updating" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Current IP: {ipAddress ?? "Detecting..."}
        </p>
      </form>
    </main>
  );
}
