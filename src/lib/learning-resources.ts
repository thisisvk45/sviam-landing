type LearningResource = {
  name: string;
  url: string;
  type: "course" | "docs" | "tutorial";
};

const SKILL_RESOURCES: Record<string, LearningResource[]> = {
  python: [
    { name: "Python Official Tutorial", url: "https://docs.python.org/3/tutorial/", type: "docs" },
    { name: "freeCodeCamp Python", url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/", type: "course" },
  ],
  javascript: [
    { name: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "docs" },
    { name: "javascript.info", url: "https://javascript.info/", type: "tutorial" },
  ],
  typescript: [
    { name: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/", type: "docs" },
  ],
  react: [
    { name: "React Official Docs", url: "https://react.dev/learn", type: "docs" },
  ],
  "node.js": [
    { name: "Node.js Learn", url: "https://nodejs.org/en/learn", type: "docs" },
  ],
  nodejs: [
    { name: "Node.js Learn", url: "https://nodejs.org/en/learn", type: "docs" },
  ],
  go: [
    { name: "Go Tour", url: "https://go.dev/tour/", type: "tutorial" },
    { name: "Go by Example", url: "https://gobyexample.com/", type: "tutorial" },
  ],
  golang: [
    { name: "Go Tour", url: "https://go.dev/tour/", type: "tutorial" },
  ],
  rust: [
    { name: "The Rust Book", url: "https://doc.rust-lang.org/book/", type: "docs" },
  ],
  java: [
    { name: "Oracle Java Tutorials", url: "https://docs.oracle.com/javase/tutorial/", type: "docs" },
  ],
  kubernetes: [
    { name: "Kubernetes Basics", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/", type: "tutorial" },
  ],
  k8s: [
    { name: "Kubernetes Basics", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/", type: "tutorial" },
  ],
  docker: [
    { name: "Docker Get Started", url: "https://docs.docker.com/get-started/", type: "tutorial" },
  ],
  aws: [
    { name: "AWS Skill Builder", url: "https://explore.skillbuilder.aws/", type: "course" },
  ],
  gcp: [
    { name: "Google Cloud Skills Boost", url: "https://www.cloudskillsboost.google/", type: "course" },
  ],
  postgresql: [
    { name: "PostgreSQL Tutorial", url: "https://www.postgresqltutorial.com/", type: "tutorial" },
  ],
  postgres: [
    { name: "PostgreSQL Tutorial", url: "https://www.postgresqltutorial.com/", type: "tutorial" },
  ],
  mongodb: [
    { name: "MongoDB University", url: "https://learn.mongodb.com/", type: "course" },
  ],
  redis: [
    { name: "Redis University", url: "https://university.redis.io/", type: "course" },
  ],
  kafka: [
    { name: "Kafka Quickstart", url: "https://kafka.apache.org/quickstart", type: "tutorial" },
  ],
  graphql: [
    { name: "GraphQL Learn", url: "https://graphql.org/learn/", type: "docs" },
  ],
  sql: [
    { name: "SQLBolt", url: "https://sqlbolt.com/", type: "tutorial" },
  ],
  "machine learning": [
    { name: "fast.ai", url: "https://www.fast.ai/", type: "course" },
    { name: "Andrew Ng's ML Course", url: "https://www.coursera.org/learn/machine-learning", type: "course" },
  ],
  tensorflow: [
    { name: "TensorFlow Tutorials", url: "https://www.tensorflow.org/tutorials", type: "tutorial" },
  ],
  pytorch: [
    { name: "PyTorch Tutorials", url: "https://pytorch.org/tutorials/", type: "tutorial" },
  ],
  "system design": [
    { name: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "tutorial" },
  ],
  "ci/cd": [
    { name: "GitHub Actions Docs", url: "https://docs.github.com/en/actions", type: "docs" },
  ],
  terraform: [
    { name: "Terraform Learn", url: "https://developer.hashicorp.com/terraform/tutorials", type: "tutorial" },
  ],
  linux: [
    { name: "Linux Journey", url: "https://linuxjourney.com/", type: "tutorial" },
  ],
  git: [
    { name: "Pro Git Book", url: "https://git-scm.com/book/en/v2", type: "docs" },
  ],
  "data structures": [
    { name: "Visualgo", url: "https://visualgo.net/", type: "tutorial" },
  ],
  algorithms: [
    { name: "Visualgo", url: "https://visualgo.net/", type: "tutorial" },
  ],
  css: [
    { name: "CSS Tricks", url: "https://css-tricks.com/", type: "tutorial" },
  ],
  html: [
    { name: "MDN HTML Basics", url: "https://developer.mozilla.org/en-US/docs/Learn/HTML", type: "docs" },
  ],
  flutter: [
    { name: "Flutter Codelabs", url: "https://docs.flutter.dev/codelabs", type: "tutorial" },
  ],
  swift: [
    { name: "Swift.org", url: "https://www.swift.org/getting-started/", type: "docs" },
  ],
  kotlin: [
    { name: "Kotlin Koans", url: "https://play.kotlinlang.org/koans/overview", type: "tutorial" },
  ],
  "c++": [
    { name: "LearnCpp", url: "https://www.learncpp.com/", type: "tutorial" },
  ],
  angular: [
    { name: "Angular Tutorial", url: "https://angular.dev/tutorials", type: "tutorial" },
  ],
  vue: [
    { name: "Vue.js Guide", url: "https://vuejs.org/guide/introduction", type: "docs" },
  ],
  django: [
    { name: "Django Tutorial", url: "https://docs.djangoproject.com/en/stable/intro/tutorial01/", type: "tutorial" },
  ],
  flask: [
    { name: "Flask Tutorial", url: "https://flask.palletsprojects.com/en/stable/tutorial/", type: "tutorial" },
  ],
  "spring boot": [
    { name: "Spring Guides", url: "https://spring.io/guides", type: "tutorial" },
  ],
  elasticsearch: [
    { name: "Elastic Docs", url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html", type: "docs" },
  ],
};

export function getResourcesForSkill(skill: string): LearningResource[] {
  const normalized = skill.toLowerCase().trim();
  return SKILL_RESOURCES[normalized] || [];
}

export function getResourcesForSkills(skills: string[]): { skill: string; resources: LearningResource[] }[] {
  return skills
    .map((skill) => ({
      skill,
      resources: getResourcesForSkill(skill),
    }))
    .filter((entry) => entry.resources.length > 0);
}
