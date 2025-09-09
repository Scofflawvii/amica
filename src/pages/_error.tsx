import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import type { NextPageContext } from "next";

type Props = {
  statusCode?: number;
};

const CustomErrorComponent = (props: Props) => {
  const code: number = props.statusCode ?? 500;
  return <Error statusCode={code} />;
};

CustomErrorComponent.getInitialProps = async (
  contextData: NextPageContext & { err?: Error },
) => {
  // Await to allow Sentry to flush in serverless environments
  // Sentry expects Next.js error context; cast to unknown to avoid any
  await Sentry.captureUnderscoreErrorException(
    contextData as unknown as Parameters<
      typeof Sentry.captureUnderscoreErrorException
    >[0],
  );
  // Mirror Next default behavior
  return (
    Error as unknown as {
      getInitialProps: (ctx: NextPageContext) => Promise<Props>;
    }
  ).getInitialProps(contextData);
};

export default CustomErrorComponent;
