import Head from "expo-router/head";
import Login from "../components/Login";

const LoginPage = () => {
  return (
    <>
      <Head>
        <title>Login | ReadMeMaybe</title>
        <meta name="description" content="Sign in to ReadMeMaybe." />
      </Head>
      <Login />
    </>
  );
};

export default LoginPage;
