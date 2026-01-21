import os
import resend

# Config
FROM_EMAIL = os.getenv("FROM_EMAIL", "Study Buddy <onboarding@resend.dev>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "")


def _ensure_resend():
    """
    Configure resend lazily so missing env vars don't crash the whole API on import.
    """
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        raise RuntimeError("RESEND_API_KEY is missing")
    resend.api_key = api_key


def send_verification_email(email: str, token: str):
    _ensure_resend()

    verify_link = f"{FRONTEND_URL}/verify-email?token={token}" if FRONTEND_URL else token

    params = {
        "from": FROM_EMAIL,
        "to": [email],
        "subject": "Verify your Study Buddy account",
        "html": f"""
        <h2>Welcome to Study Buddy 🎓</h2>
        <p>Please verify your email to activate your account:</p>
        <a href="{verify_link}"
           style="padding:10px 15px;background:#4F46E5;color:white;text-decoration:none;border-radius:5px;">
           Verify Email
        </a>
        <p>This link expires soon.</p>
        """,
    }

    resp = resend.Emails.send(params)
    print("Resend send_verification_email response:", resp)
    return resp


def send_welcome_email(email: str):
    _ensure_resend()

    params = {
        "from": FROM_EMAIL,
        "to": [email],
        "subject": "Welcome to Study Buddy 🚀",
        "html": """
        <h2>You're officially in! 🎉</h2>
        <p>Your email has been verified.</p>
        <p>Start learning smarter with Study Buddy.</p>
        """,
    }

    resp = resend.Emails.send(params)
    print("Resend send_welcome_email response:", resp)
    return resp


def send_otp_email(email: str, otp: str):
    _ensure_resend()

    params = {
        "from": FROM_EMAIL,
        "to": [email],
        "subject": "Your Study Buddy Verification Code",
        "html": f"""
        <h2>Verify your email</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:4px;">{otp}</h1>
        <p>This code expires in <b>10 minutes</b>.</p>
        """,
    }

    resp = resend.Emails.send(params)
    print("Resend send_otp_email response:", resp)
    return resp
