import type {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
} from "aws-lambda"

export const handler = (
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return Promise.resolve({
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Organization API placeholder",
    }),
  })
}
