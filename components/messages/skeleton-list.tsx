import { Skeleton } from "../ui/skeleton";

export default function SkeletonList() {
    return (
        <div className="mt-4">
            <Skeleton className="h-[50px] w-[50%] rounded-xl" />
            <Skeleton className="h-[40px] w-[55%] rounded-xl mt-3" />
            <Skeleton className="h-[60px] w-[53%] rounded-xl mt-5 ml-auto" />
            <Skeleton className="h-[40px] w-[59%] rounded-xl mt-5" />
            <Skeleton className="h-[40px] w-[43%] rounded-xl mt-5 ml-auto" />
            <Skeleton className="h-[80px] w-[55%] rounded-xl mt-3 ml-auto" />
        </div>
    );
}
