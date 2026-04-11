import Head from "expo-router/head";
import MyReadMes from "../components/MyReadMes";

const MyReadMesPage = () => {
  return (
    <>
      <Head>
        <title>My READMEs</title>
        <meta
          name="description"
          content="Browse and manage your saved README content."
        />
      </Head>
      <MyReadMes />
    </>
  );
};

export default MyReadMesPage;
