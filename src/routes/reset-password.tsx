import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { KeyRound, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — BarterKartale" },
      { name: "description", content: "Choose a new password for your BarterKartale account." },
      { property: "og:title", content: "Set a new password — BarterKartale" },
      { property: "og:description", content: "Choose a new password for your account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage("This reset link has expired or is invalid. Please request a new one.");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="modal-backdrop">
      <div className="form-modal">
        <div className="auth-panel">
          <div className="login-mark"><KeyRound size={20} /></div>
          <div className="section-kicker">RESET YOUR PASSWORD</div>
          <h2>Choose a <em>new password.</em></h2>
          <form onSubmit={submit}>
            <label>New password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
            <button className="primary-button full-button" disabled={loading}>{loading ? "Saving…" : "Save password"} <ArrowRight size={16} /></button>
          </form>
          {message && <p>{message}</p>}
        </div>
      </div>
    </div>
  );
}
