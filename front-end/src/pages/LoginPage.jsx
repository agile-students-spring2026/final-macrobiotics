import { useState } from "react";

function LoginPage({ onGoBack }){

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleContinue() {
        if (onGoBack) {
            onGoBack("intro");
        }
    }

    return(

        <section className ="screen login-screen">

            <div className ="login-panel">

                <header className="login-header">
                    <p className="login-header__eyebrow">Account access</p>
                    <h2 className="login-header__title">Sign Up or Log In</h2>
                    <p className="login-header__copy">
                        Continue with your email or use your organization&apos;s single sign-on.
                    </p>
                </header>

                <div className="details">
                    
                    <span>Email</span>
                    <input
                        type="email"
                        placeholder="youremail@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="details">
                    
                    <span>Password</span>
                    <input
                        type="password"
                        placeholder="xxxxxxxx"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="login-buttons">

                    <button
                        className="default-login-button"
                        type="button"
                        onClick={handleContinue}
                    >
                        Sign Up or Log In
                    </button>

                    <button
                        className="sso-login-button"
                        type="button"
                        onClick={handleContinue}
                    >
                        Sign In With SSO
                    </button>

                </div>

            </div>

        </section>
    );
}

export default LoginPage;
