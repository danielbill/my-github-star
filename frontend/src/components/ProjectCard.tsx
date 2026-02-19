import React from 'react';
import { Badge, Group, Text, Anchor, Button, Flex } from '@mantine/core';
import { IconBrandGithub, IconStarFilled, IconGitFork } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Repository } from '../types';
import { OpenURL } from '../../wailsjs/go/backend/App';
import classes from './ProjectCard.module.css';

interface ProjectCardProps {
  repository: Repository;
}

const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#239120',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Lua: '#000080',
  Julia: '#a270ba',
  R: '#198CE7',
  Matlab: '#e16737',
  Jupyter: '#F37626',
};

function formatStars(stars: number): string {
  if (stars >= 1000000) {
    return `${(stars / 1000000).toFixed(1)}M`;
  }
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}K`;
  }
  return stars.toString();
}

function getLanguageColor(language: string): string {
  return languageColors[language] || '#8b949e';
}

export function ProjectCard({ repository }: ProjectCardProps) {
  const [owner, repoName] = repository.full_name.split('/');

  const handleTitleClick = (e: React.MouseEvent) => {
    OpenURL(repository.html_url);
  };

  const repoData = {
    id: repository.id,
    name: repository.name,
    full_name: repository.full_name,
    owner: repository.owner,
    description: repository.description,
    language: repository.language,
    stargazers_count: repository.stargazers_count,
    stars_today: repository.stars_today,
    stars_since: repository.stars_since,
    forks_count: repository.forks_count,
    html_url: repository.html_url,
    created_at: repository.created_at,
    updated_at: repository.updated_at,
  };

  return (
    <div className={classes.cardItem}>
      <Flex justify="space-between" align="flex-start" gap="md">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" align="center" mb={4}>
            <IconBrandGithub size={16} className={classes.repoIcon} />
            <Anchor
              component={Link}
              to={`/repo/${owner}/${repoName}`}
              state={{ repository: repoData }}
              onClick={handleTitleClick}
              fw={600}
              size="sm"
              className={classes.repoLink}
            >
              {repository.full_name}
            </Anchor>
            <IconStarFilled size={13} className={classes.starIcon} />
            <Text size="xs" c="var(--color-text-secondary)">
              {formatStars(repository.stargazers_count)}
            </Text>
          </Group>

          <Text size="sm" c="var(--color-text-secondary)" className={classes.description}>
            {repository.description || 'No description provided'}
          </Text>
        </div>

        {(repository.stars_since && repository.stars_since > 0) ||
         (repository.stars_today && repository.stars_today > 0) ? (
          <Text size="xs" c="var(--color-text-secondary)">
            +{repository.stars_since || repository.stars_today || 0} stars
          </Text>
        ) : null}

      </Flex>
    </div>
  );
}
