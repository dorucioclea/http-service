import { Post } from "./entities/post";
import { HttpService, ApiServiceConfig } from "./api/http-service";
import { ConsoleLogger } from "./api/logging/implementation/console-logger";
import { LogLevel } from "./api/logging/log-level";

const apiOptions: ApiServiceConfig = {
  baseURL: "https://jsonplaceholder.typicode.com",
  retryOptions: {
    delayBetweenRetries: 100,
    maxRetryCount: 2,
  }
};

// Change this to the desired level of logging
//
const apiLogger = new ConsoleLogger(LogLevel.Debug);

const apiService = new HttpService(apiOptions, apiLogger);

// Alternatively you can do it like this
//

const responsePromise = apiService.get<Post[]>("/posts", { userId: 1 });

responsePromise.then((response: Post[]) => {
  console.log("RSP", response);
});

// Of course the response promise can be awaited - just not here bcuz we don't have
// await support
//
