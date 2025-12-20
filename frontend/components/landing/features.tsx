import { Card, CardHeader } from "@heroui/card";
import { Image } from "@heroui/image";

export default function Features() {
  return (
    <div className="max-w-[900px] gap-2 grid grid-cols-12 grid-rows-2 px-8">
      <Card className="col-span-12 sm:col-span-4 h-[300px]">
        <CardHeader className="absolute z-10 top-1 flex-col items-start!">
          <p className="text-tiny text-white/60 uppercase font-bold">
            Access 2.3M+ scholarly papers
          </p>
          <h4 className="text-white font-medium text-large">
            Comprehensive Data Coverage
          </h4>
        </CardHeader>
        <Image
          removeWrapper
          alt="A large collection of scholarly papers representing comprehensive data coverage"
          className="z-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1556033368-8a5d814918f3?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        />
      </Card>
      <Card className="col-span-12 sm:col-span-4 h-[300px]">
        <CardHeader className="absolute z-10 top-1 flex-col items-start!">
          <p className="text-tiny text-white/60 uppercase font-bold">
            Advanced Analysis
          </p>
          <h4 className="text-white font-medium text-large">
            AI-Driven Insights
          </h4>
        </CardHeader>
        <Image
          removeWrapper
          alt="Abstract visualization of neural networks representing AI-driven research insights"
          className="z-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1675000971728-32e5470fb1c0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        />
      </Card>
      <Card className="col-span-12 sm:col-span-4 h-[300px]">
        <CardHeader className="absolute z-10 top-1 flex-col items-start!">
          <p className="text-tiny text-white/60 uppercase font-bold">
            Visualize citation patterns
          </p>
          <h4 className="text-white font-medium text-large">
            Citation Network Analysis
          </h4>
        </CardHeader>
        <Image
          removeWrapper
          alt="Complex node-based citation network visualization"
          className="z-0 w-full h-full object-cover"
          src="https://static.vecteezy.com/system/resources/previews/005/678/621/non_2x/purple-network-plexus-line-background-concept-pattern-with-light-polygon-elements-and-nodes-minimal-space-design-vector.jpg"
        />
      </Card>
      <Card
        isFooterBlurred
        className="w-full h-[300px] col-span-12 sm:col-span-5"
      >
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <p className="text-tiny text-white/60 uppercase font-bold">
            Spot emerging research topics
          </p>
          <h4 className="text-white font-medium text-2xl">Trend Discovery</h4>
        </CardHeader>
        <Image
          removeWrapper
          alt="Data visualization chart showing emerging research trends"
          className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
          src="https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?q=80&w=1473&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        />
      </Card>
      <Card
        isFooterBlurred
        className="w-full h-[300px] col-span-12 sm:col-span-7"
      >
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <p className="text-tiny text-white/60 uppercase font-bold">
            User-Centric Design
          </p>
          <h4 className="text-white/90 font-medium text-xl">
            Intuitive and Customizable interface{" "}
          </h4>
        </CardHeader>
        <Image
          removeWrapper
          alt="A mockup of the Metascience Platform modern and intuitive user interface"
          className="z-0 w-full h-full object-cover"
          src="https://i.postimg.cc/D0JK1gC6/mockupmetascience.png"
        />
      </Card>
    </div>
  );
}
