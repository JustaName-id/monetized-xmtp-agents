import { MyAgentCard } from "@/components/MyAgentCard";

export default async function Index() {
    // const initialData = await getMyAgents();

    return (
        <div className="wrapper">
            <div className="container flex flex-col gap-6">
                <h1 className="text-3xl font-normal text-primary leading-[100%]">Your Agents</h1>
                <MyAgentCard
                    subname="Agent 1"
                    avatar="https://i.pravatar.cc/300?img=1"
                    price={100}
                    description="This is a description"
                    tags={["tag1", "tag2", "tag3"]}
                    consumption={100}
                />
                <MyAgentCard
                    subname="Agent 1"
                    avatar="https://i.pravatar.cc/300?img=1"
                    price={100}
                    description="This is a description"
                    tags={["tag1", "tag2", "tag3"]}
                    consumption={100}
                />
                <MyAgentCard
                    subname="Agent 1"
                    avatar="https://i.pravatar.cc/300?img=1"
                    price={100}
                    description="This is a description"
                    tags={["tag1", "tag2", "tag3"]}
                    consumption={100}
                />
            </div>
        </div>
    );
}
