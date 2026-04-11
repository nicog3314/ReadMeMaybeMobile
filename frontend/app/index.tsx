import Head from "expo-router/head";
import Login from "./components/Login";

export default function Index() {
  return (
    <>
      <Head>
        <title>Login | ReadMeMaybe</title>
        <meta name="description" content="Sign in to ReadMeMaybe." />
      </Head>
      <Login />
    </>
  );
}
