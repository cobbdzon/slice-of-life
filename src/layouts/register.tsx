import type { FC } from 'hono/jsx'

export const RegisterLayout: FC = (props) => {
  return (
    <html>
      <body>
        <div class="main">
          <h1>Slice of Life</h1>
          <h3>Create an account</h3>

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
                Register
              </button>
            </div>
          </form>

          <p>Already registered?
            <a href="login" style="text-decoration: none;">Log in</a>
          </p>
        </div>
      </body>

    </html>
  )
}
