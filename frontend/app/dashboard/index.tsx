import Head from "expo-router/head";
import Dashboard from "../components/Dashboard";

const DashboardPage = () => {
  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <Dashboard />
    </>
  );
};

export default DashboardPage;
