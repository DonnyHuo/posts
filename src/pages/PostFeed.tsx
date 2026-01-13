import { Link, useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import PostList from "../components/PostList";
import type { User } from "../types";

interface PostFeedProps {
  mode: "my" | "all";
}

export default function PostFeed({ mode }: PostFeedProps) {
  const { currentUser } = useOutletContext<{ currentUser: User | null }>();
  const isMyPosts = mode === "my";

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isMyPosts ? "My Posts" : "Community Posts"}
          </h2>
          <p className="mt-1 text-gray-500">
            {isMyPosts
              ? "Manage and create your own content"
              : "See what others are writing about"}
          </p>
        </div>
        {isMyPosts && (
          <Link
            to="/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto justify-center"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Post
          </Link>
        )}
      </div>

      <PostList myPosts={isMyPosts} currentUser={currentUser} />
    </>
  );
}
