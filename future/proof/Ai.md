---
title: How to debug 404 errors
description: Learn the systematic steps to identify and resolve 404 issues.
url: "https://vercel.com/kb/guide/how-to-debug-404-errors"
published: 2026-03-13
last_updated: 2026-07-16
authors: kubu Lee 
install_vercel_plugin: npx plugins add vercel/vercel-plugin
---

Sometimes things don't go as expected when deploying a website. If you see a 404 on your site, that means the page or resource couldn't be found.

There are many possible causes, and the absence of something can be tricky to debug if you don't know where to look. Here are some things you can do to find the cause and fix it.

## Identify the error code

If you see a screen with `404: NOT_FOUND`, along with a Code and an ID, click the blue info box below the error details to find an explanation of the error and some tips to help you solve it.

![404 not found message](https://images.ctfassets.net/hjgychtc108g/6Os5ZROOriinnDe54IhnZU/68bd777e2577e3057773bca2eb9f5c12/pikachu44444.vercel.app___1_.png)

The error code's documentation explains the scenarios in which that problem may occur. It also has a set of troubleshooting steps specific to that problem.

## Verify the deployment exists

It's a good idea to check the deployment URL for typos or incorrect paths. This is especially true when accessing specific deployments using [Generated URLs,](https://vercel.com/docs/deployments/generated-urls#accessing-deployments-through-generated-urls) which contain a unique hash.

You should review the [deployment list](https://vercel.com/docs/projects/project-dashboard#deployments) from your [project dashboard](https://vercel.com/docs/projects/project-dashboard#project-dashboard) to make sure that (1) the deployment was successful, (2) the deployment was not deleted, and (3) the URL you're visiting is the correct one for that deployment.

If the deployment exists, review the [deployment logs](https://vercel.com/docs/deployments/logs) for issues that might have caused the deployment to be unavailable. If there are uncaught errors in a function or component, those could bubble up and cause you to see a 404 error. In this case, a [try/catch statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) can help.

## Inspect the build output

The build output might be different from what you expect. You can check it by navigating to the deployment's details page on your project dashboard. From there, you can go over to the **Source** tab to check both the **Source** and **Output** for that deployment.

![example.com\_anshumans-labs\_nuxt-latest\_DxMd6NC9fKKUNqCnCHgmbR1hWcQn\_source\_f\_out-2Fauthors\_\_1\_.png](https://images.ctfassets.net/hjgychtc108g/38hYMWZqaVno8KgK2b33UL/d182c6f874be2e0cd3065de805dd99ed/vercel.com_anshumans-labs_nuxt-latest_DxMd6NC9fKKUNqCnCHgmbR1hWcQn_source_f_out-2Fauthors__1_.png)

Make sure the file your framework uses as the homepage is present. For many projects this should be an `index.html` file at the root level of the deployment output.

Be careful of capitalization. If the project has a capitalized `Index.html` you should change it to lowercase `index.html` and try a new deployment with that change.

If the project uses a traditionally server-side framework, [such as Express](https://vercel.com/guides/using-express-with-vercel), you should make sure to put the `index.js` file in a `/api` directory so it will be deployed as a serverless function. In that case the path to the first page of your site would look like `my-website.com/api` which can be altered to use the root path `/` using [rewrites](https://vercel.com/docs/edge-network/rewrites#rewrites-on-vercel). More specific Express project patterns and troubleshooting tips are covered in [Express 101: Everything about deploying your Express app on Vercel](https://community.vercel.com/t/express-101-everything-about-deploying-your-express-app-on-vercel/4870).

## **Review project configuration**

If you find that the build output doesn't match what you expect, the difference may have been caused by build settings or other project configuration. You can use the CLI to test a build on your local computer with the `vercel build` command. That can help you test configuration changes without creating a new deployment for each change.

If you're using a framework, such as Next.js, then you can usually rely on the corresponding [Framework Preset](https://vercel.com/docs/deployments/configure-a-build#framework-preset) in the project's **Build and Development Settings**. If any of the commands have overrides, that could be the source of the problem.

The [Output Directory](https://vercel.com/docs/deployments/configure-a-build#output-directory) is often overlooked, but can have a big effect on the deployment. Only the contents of this directory are statically served as part of your deployment, so it's important that the correct value is used for this setting.

Check the [Build and Development Settings](https://vercel.com/docs/deployments/configure-a-build#build-and-development-settings) and [Root Directory](https://vercel.com/docs/deployments/configure-a-build#root-directory) carefully to make sure they're correct for your project.

You can also update framework preset, build command, and output directory directly from the CLI using `vercel project update` (requires CLI v54.21.1+), without going through the dashboard:

```bash
vercel project update <project> --framework <slug> --build-command "<cmd>" --output-directory <dir>
```

Only the flags you pass are changed and omitted settings are left untouched. Note that root directory cannot be set via the CLI; change it through the dashboard or your `vercel.json` file.

If the project is part of a [monorepo](https://vercel.com/docs/monorepos#using-monorepos), you'll also want to check that the [root directory](https://vercel.com/docs/deployments/configure-a-build#root-directory) is set correctly. An incorrect root directory value would definitely cause unexpected deployment output.

Configuration files within a project are also good to check. If the project uses a `vercel.json` file for configuration, such as setting path rewrites or scheduling cron jobs, it's possible that something in the config file caused the 404.

Some frameworks or packages use their own routing method that requires all requests to pass through a single path. This is often seen in SPA, Express, and other projects with similar architectures. You can solve it using [rewrites](https://vercel.com/docs/edge-network/rewrites#rewrites-on-vercel) to direct traffic through the router.

[React Router example](https://stackoverflow.com/a/65644138):

```json
{ "rewrites": [{"source": "/(.*)", "destination": "/"}]  }
```

Many frameworks use their own configuration files to set redirects, rewrites, runtimes, and other values. It's worth checking the documentation for your framework to verify that the repo is configured correctly for serverless deployment with Vercel.

## **Check domain configuration**

If something is wrong with the domain configuration, that could cause a 404 error.

You can check the domain settings within project settings to make sure the domain is added to the project and it has a verified **Valid Configuration** status. Any detectable invalid configuration will be flagged with a description of what is missing.

Sometimes the solution to a domain configuration issue is not obvious. The [domain troubleshooting](https://vercel.com/docs/projects/domains/troubleshooting) doc describes domain, DNS, and SSL debugging steps.

## **Verify access role and permissions**

If you're on a team with multiple people, you may have run into a [permissions](https://vercel.com/docs/accounts/team-members-and-roles) issue. Check that you are allowed to access the deployment by your role and project settings.

If your team uses [Trusted IPs](https://vercel.com/docs/security/deployment-protection/methods-to-protect-deployments/trusted-ips#trusted-ips) to restrict deployment access, then you'll get a 404 error if you attempt to visit from an IP address that is not specifically allowed.

You should ask the team owner to check your [access group](https://vercel.com/docs/accounts/team-members-and-roles/access-groups#modifying-access-groups-for-a-single-team-member) and the project's [deployment protection](https://vercel.com/docs/security/deployment-protection#deployment-protection-on-vercel) settings to help you get the deployment access you need.

## **Practical applications**

- Someone reached out about a 404 error on the homepage of their static site.
  
- We looked into the deployment output and found that the deployment was successful and pages were available, but there was no `index.html` in the output. Paths like `example.com/about` were working fine, but `example.com/` was returning a 404.
  
- The homepage `/` path worked as expected after switching the name of `main.html` to `index.html` with a new deployment.
  
- A community member asked for help with a 404 error. The code was `DEPLOYMENT_NOT_FOUND` so we determined that either the URL was wrong or the deployment was deleted.
  
- Upon reviewing the deployment list and checking with their team, it was discovered that another team member had deleted the deployment. Switching to the URL of a more recent deployment allowed them to continue their work.
  

## **Resources**

- [Error Codes](https://vercel.com/docs/errors#error-codes)
  
- [Vercel Functions](https://vercel.com/docs/functions#vercel-functions)
  
- [Using the Node.js Runtime with Serverless Functions](https://vercel.com/docs/functions/runtimes/node-js#using-the-node.js-runtime-with-serverless-functions)
  
- [Using the Python Runtime with Serverless Functions](https://vercel.com/docs/functions/runtimes/python#using-the-python-runtime-with-serverless-functions)
  
- [Monorepos on Vercel](https://vercel.com/docs/monorepos#using-monorepos)

## More Deployment Protection guides

- [How do I add password protection to my Vercel deployment?](/kb/guide/how-do-i-add-password-protection-to-my-vercel-deployment): Enable Password Protection on a Vercel deployment, configure automation and CORS bypasses, and verify the gate before your next CI run.
- [How can I run end-to-end tests after my Vercel Preview Deployment?](/kb/guide/how-can-i-run-end-to-end-tests-after-my-vercel-preview-deployment): Learn how to use the Vercel CLI in combination with your CI/CD provider to run end-to-end tests for every code change.
- [Troubleshooting Cross-Origin Errors (net::ERR\_BLOCKED\_BY\_ORB) with Deployment Protection](/kb/guide/troubleshooting-cross-origin-errors-neterr-blocked-by-orb-with-deployment-protection): Learn to resolve \`net::ERR\_BLOCKED\_BY\_ORB\` errors on protected Vercel deployments. This guide explains how cross-origin asset requests conflict with Vercel Authentication and shows the fix for Sitecore JSS apps using the \`PUBLIC\_URL\` environment variable.
