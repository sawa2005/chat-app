import { Skeleton } from "../ui/skeleton";

export default function SkeletonList() {
    return (
        <div className="mt-4 h-full flex flex-col justify-between gap-2">
            <Skeleton className="h-[10%] w-[50%] min-h-8 rounded-xl" />
            <Skeleton className="h-[20%] w-[55%] min-h-8 rounded-xl" />
            <Skeleton className="h-[15%] w-[53%] min-h-8 rounded-xl ml-auto" />
            <Skeleton className="h-[7%] w-[59%] min-h-8 rounded-xl" />
            <Skeleton className="h-[10%] w-[43%] min-h-8 rounded-xl ml-auto" />
            <Skeleton className="h-[7%] w-[43%] min-h-8 rounded-xl ml-auto" />
            <Skeleton className="h-[10%] w-[55%] min-h-8 rounded-xl ml-auto" />
        </div>
    );
}
