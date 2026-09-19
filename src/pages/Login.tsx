import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BookMarked } from "lucide-react";

export default function Login() {
  const { signInWithPassphrase, user } = useAuth();
  const navigate = useNavigate();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate("/", { replace: true });
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await signInWithPassphrase(passphrase);
    setBusy(false);
    if (error) {
      setError("That passphrase didn't work.");
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookMarked className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Books</h1>
          <p className="text-sm text-muted-foreground">Enter your passphrase</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="password"
            autoFocus
            placeholder="Passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || !passphrase}>
            {busy ? "…" : "Unlock"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
