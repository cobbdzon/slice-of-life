import type { FC } from 'hono/jsx'

export const LoginLayout: FC = (props) => {
  return (
    <html>
      <body>
        <div class="main">
          <h1>Slice of Life</h1>
          <h3>Enter your login credentials</h3>

          <form method="post">
            <label for="username">
              Username:
            </label>
            <input type="text" id="username" name="username"
              placeholder="Enter your Username" required></input>

            <label for="password">
              Password:
            </label>
            <input type="password" id="password" name="password"
              placeholder="Enter your Password" required></input>

            <div class="wrap">
              <button type="submit">
                Submit
              </button>
            </div>
          </form>

          <p>Not registered?
            <a href="register" style="text-decoration: none;">Create an account</a>
          </p>
        </div>
      </body>

    </html>
  )
}
