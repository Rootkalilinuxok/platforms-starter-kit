import {MDXRemote} from 'next-mdx-remote/rsc';
import {ComponentProps} from 'react';

const components: ComponentProps<typeof MDXRemote>['components'] = {
  a: (props) => (
    <a {...props} className="font-medium text-primary underline-offset-4 hover:underline" />
  ),
  strong: (props) => <strong {...props} className="font-semibold" />
};

export function MdxContent({source}: {source: string}) {
  return <MDXRemote source={source} components={components} />;
}
