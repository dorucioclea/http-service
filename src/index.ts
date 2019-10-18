import { Post } from "./entities/post";
import { ApiService, ApiServiceConfig } from "./api/api";

const apiOptions: ApiServiceConfig = {
  baseURL: "https://jsonplaceholder.typicode.com",
  retryOptions: {
    delayBetweenRetries: 100,
    maxRetryCount: 2,
  }
};

const apiService = new ApiService(apiOptions);

// Alternatively you can do it like this
//

const responsePromise = apiService.get<Post[]>("/posts", { userId: 1 });

responsePromise.then((response: Post[]) => {
  console.log("RSP", response);
});

// Of course the response promise can be awaited - just not here bcuz we don't have
// await support
//
