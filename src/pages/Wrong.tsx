import styled from '@emotion/styled';
import WrongNoteListItem from '@/features/wrong/components/WrongNoteListItem';
import api from '@/shared/api/axiosClient';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { WrongNoteSetResponse } from '@/features/wrong/types/wrongNote';
import { useState, useEffect, useCallback } from 'react';
import Spinner from '@/shared/components/Spinner';
import RightClickMenu from '@/features/library/components/RightClickMenu/RightClickMenu';
import RightClickMenuItem from '@/features/library/components/RightClickMenu/RightClickMenuItem';
import RightClickMenuDivider from '@/features/library/components/RightClickMenu/RightClickMenuDivider';
import { useNavigate } from 'react-router-dom';

interface Folder {
  id: number;
  name: string;
  type: 'WRONG_NOTE';
  sortOrder: number;
}

type WrongNoteItem = WrongNoteSetResponse[number];

const WRONG_NOTE_TYPE = 'QUESTION_SET'; // * 중요! 나중에 오답노트용 API로 바꿔줘야함
const ALL_FOLDER_ID = 1;

const WrongWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: ${({ theme }) => theme.colors.background.background};
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  justify-content: flex-start;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1000px;
`;

const WrongPageTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.spacing2};
  margin-bottom: ${({ theme }) => theme.spacing.spacing2};
`;

const WrongPageTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.title1Bold.fontSize};
  font-weight: ${({ theme }) => theme.typography.title1Bold.fontWeight};
  line-height: ${({ theme }) => theme.typography.title1Bold.lineHeight};
`;

const WrongPageDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.subtitle2Regular.fontSize};
  font-weight: ${({ theme }) => theme.typography.subtitle2Regular.fontWeight};
  line-height: ${({ theme }) => theme.typography.subtitle2Regular.lineHeight};
  color: ${({ theme }) => theme.colors.gray.gray7};
`;

const SearchBarWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.spacing7};
  margin-bottom: ${({ theme }) => theme.spacing.spacing7};
`;

const SearchBarDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.label2Regular.fontSize};
  font-weight: ${({ theme }) => theme.typography.label2Regular.fontWeight};
  line-height: ${({ theme }) => theme.typography.label2Regular.lineHeight};
  color: ${({ theme }) => theme.colors.gray.gray7};
`;

const SearchBar = styled.input`
  width: 300px;
  height: 30px;
  border: 1px solid ${({ theme }) => theme.colors.gray.gray4};
  border-radius: ${({ theme }) => theme.radius.radius2};
  background-color: ${({ theme }) => theme.colors.gray.gray0};
  font-size: ${({ theme }) => theme.typography.label1Regular.fontSize};
  font-weight: ${({ theme }) => theme.typography.label1Regular.fontWeight};
  line-height: ${({ theme }) => theme.typography.label1Regular.lineHeight};
  padding: ${({ theme }) => theme.spacing.spacing2};

  border: 1px solid ${({ theme }) => theme.colors.gray.gray3};
  border-radius: ${({ theme }) => theme.radius.radius1};
  &:focus {
    outline: none;
    border: 1px solid ${({ theme }) => theme.colors.semantic.primary};
    border-radius: ${({ theme }) => theme.radius.radius2};
  }
`;

const FolderContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const FolderTag = styled.div<{
  isDragOver?: boolean;
  folderColor: string;
  folderHoverColor: string;
  isActive?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.radius2};
  background-color: ${({
    isDragOver,
    folderColor,
    folderHoverColor,
    isActive,
  }) => (isDragOver || isActive ? folderHoverColor : folderColor)};
  border: 1px solid
    ${({ isDragOver, folderHoverColor, isActive }) =>
      isDragOver || isActive ? folderHoverColor : 'transparent'};
  font-size: ${({ theme }) => theme.typography.body3Regular.fontSize};
  color: white;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  user-select: none;
  font-weight: ${({ isActive }) => (isActive ? '700' : '500')};
  box-shadow: ${({ isActive }) =>
    isActive ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'};

  &:hover {
    background-color: ${({ folderHoverColor }) => folderHoverColor};
    border-color: ${({ folderHoverColor }) => folderHoverColor};
    color: white;
  }
`;

const AddFolderButton = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.radius2};
  background-color: ${({ theme }) => theme.colors.background.foreground};
  border: 1px dashed ${({ theme }) => theme.colors.border.border1};
  font-size: ${({ theme }) => theme.typography.body3Regular.fontSize};
  color: ${({ theme }) => theme.colors.text.default};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  user-select: none;

  &:hover {
    background-color: ${({ theme }) => theme.colors.semantic.primary};
    border-color: ${({ theme }) => theme.colors.semantic.primary};
    border-style: solid;
    color: white;
  }
`;

const FolderInputContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.radius2};
  background-color: ${({ theme }) => theme.colors.background.foreground};
  border: 1px solid ${({ theme }) => theme.colors.semantic.primary};
`;

const FolderInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  font-size: ${({ theme }) => theme.typography.body3Regular.fontSize};
  color: ${({ theme }) => theme.colors.text.default};
  width: 120px;
  padding: 0;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.subtitle};
  }
`;

const FolderActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.2);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const FOLDER_COLORS = [
  { bg: '#3b82f6', hover: '#2563eb' },
  { bg: '#10b981', hover: '#059669' },
  { bg: '#8b5cf6', hover: '#7c3aed' },
  { bg: '#f59e0b', hover: '#d97706' },
  { bg: '#ec4899', hover: '#db2777' },
  { bg: '#06b6d4', hover: '#0891b2' },
  { bg: '#ef4444', hover: '#dc2626' },
  { bg: '#6366f1', hover: '#4f46e5' },
  { bg: '#14b8a6', hover: '#0d9488' },
  { bg: '#f97316', hover: '#ea580c' },
];

const getFolderColor = (folderId: number) => {
  const index = folderId % FOLDER_COLORS.length;
  return FOLDER_COLORS[index];
};

const WrongNoteList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.gray.gray5};
  border-radius: ${({ theme }) => theme.radius.radius2};
  overflow: hidden;
`;

const WrongNoteListHeader = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr;
  background-color: ${({ theme }) => theme.colors.gray.gray1};
  padding: ${({ theme }) => theme.spacing.spacing3}
    ${({ theme }) => theme.spacing.spacing4};
`;

const WrongNoteListHeaderColumn = styled.span`
  font-size: ${({ theme }) => theme.typography.label2Regular.fontSize};
  font-weight: ${({ theme }) => theme.typography.label2Regular.fontWeight};
  line-height: ${({ theme }) => theme.typography.label2Regular.lineHeight};
  color: ${({ theme }) => theme.colors.gray.gray9};
`;

const FolderSelectWrapper = styled.div`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FolderSelectLabel = styled.span`
  font-size: 14px;
  color: #333;
  white-space: nowrap;
`;

const FolderSelect = styled.select`
  flex: 1;
  padding: 6px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border.border1};
  border-radius: ${({ theme }) => theme.radius.radius2};
  font-size: 14px;
  background-color: ${({ theme }) => theme.colors.background.foreground};
  color: ${({ theme }) => theme.colors.text.default};
  cursor: pointer;
  outline: none;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.semantic.primary};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.semantic.primary};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

function Wrong() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<WrongNoteItem | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isVisibleFolderMenu, setIsVisibleFolderMenu] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderMousePoint, setFolderMousePoint] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const [isVisibleMenu, setIsVisibleMenu] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<WrongNoteItem | null>(null);
  const [mousePoint, setMousePoint] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleContextMenu = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    item: WrongNoteItem,
  ) => {
    e.preventDefault();
    setSelectedItem(item);
    setIsVisibleMenu(true);
    setMousePoint({ x: e.clientX, y: e.clientY });
  };

  const { data: folders, isPending: isFoldersPending } = useQuery({
    queryKey: ['wrongNoteFolders'],
    queryFn: async () => {
      const res = await api.get<Folder[]>(
        `/common-folders?type=${WRONG_NOTE_TYPE}`,
      );
      return res.data.sort((a, b) => a.sortOrder - b.sortOrder);
    },
  });

  useEffect(() => {
    if (folders && folders.length > 0 && selectedFolderId === null) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, selectedFolderId]);

  const { isPending, error, data } = useQuery({
    queryKey: ['wrongNoteSet', selectedFolderId],
    queryFn: async () => {
      if (selectedFolderId === null) {
        return [] as WrongNoteSetResponse;
      }
      const res = await api.get<WrongNoteSetResponse>(
        `/wrong-answers/all?folderId=${selectedFolderId}`,
      );
      return res.data;
    },
    enabled: selectedFolderId !== null,
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({
      questionSetId,
      folderId,
    }: {
      questionSetId: number;
      folderId: number;
    }) => {
      return api.patch(`/wrong-answers/${questionSetId}`, {
        commonFolderId: folderId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrongNoteFolders'] });
      queryClient.invalidateQueries({ queryKey: ['wrongNoteSet'] });
    },
    onError: (error) => {
      alert(`폴더 이동 중 에러가 발생했습니다: ${error.message}`);
    },
  });

  const deleteWrongNoteMutation = useMutation({
    mutationFn: (questionSetId: number) => {
      return api.delete(`/wrong-answers/${questionSetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wrongNoteSet', selectedFolderId],
      });
    },
    onError: (error) => {
      alert(`오답노트 삭제 중 에러가 발생했습니다: ${error.message}`);
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => {
      return api.post('/common-folders', {
        name,
        type: WRONG_NOTE_TYPE,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrongNoteFolders'] });
      setIsAddingFolder(false);
      setNewFolderName('');
    },
    onError: (error) => {
      alert(`폴더 생성 중 에러가 발생했습니다: ${error.message}`);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: number) => {
      return api.delete(`/common-folders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrongNoteFolders'] });
      queryClient.invalidateQueries({ queryKey: ['wrongNoteSet'] });
      if (selectedFolderId === selectedFolder?.id) {
        setSelectedFolderId(ALL_FOLDER_ID);
      }
    },
    onError: (error) => {
      alert(`폴더 삭제 중 에러가 발생했습니다: ${error.message}`);
    },
  });

  const updateFolderNameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => {
      if (!name.trim()) {
        throw new Error('폴더 이름은 비워둘 수 없습니다.');
      }
      return api.patch(`/common-folders/${id}`, {
        name,
        type: WRONG_NOTE_TYPE,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wrongNoteFolders'] });
      setEditingFolderId(null);
      setEditingFolderName('');
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFC').replace(/\s+/g, '');

  const filteredQuestionSets = data?.filter((item) =>
    normalize(item.questionSetTitle).includes(normalize(debouncedSearchTerm)),
  );

  const handleFolderContextMenu = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    folder: Folder,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedFolder(folder);
    setIsVisibleFolderMenu(true);
    setFolderMousePoint({ x: e.clientX, y: e.clientY });
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    item: WrongNoteItem,
  ) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    folderId: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, folder: Folder) => {
    e.preventDefault();
    setDragOverFolderId(null);

    if (!draggedItem) return;

    moveFolderMutation.mutate({
      questionSetId: draggedItem.questionSetId,
      folderId: folder.id,
    });

    setDraggedItem(null);
  };

  const handleAddFolder = () => {
    setIsAddingFolder(true);
  };

  const handleCancelAddFolder = () => {
    setIsAddingFolder(false);
    setNewFolderName('');
  };

  const handleConfirmAddFolder = () => {
    if (!newFolderName.trim()) {
      alert('폴더 이름을 입력해주세요.');
      return;
    }
    createFolderMutation.mutate(newFolderName.trim());
  };

  const handleFolderClick = (folderId: number) => {
    setSelectedFolderId(folderId);
  };

  const handleFolderMenuRename = useCallback(() => {
    if (!selectedFolder) return;
    setEditingFolderId(selectedFolder.id);
    setEditingFolderName(selectedFolder.name);
    setIsVisibleFolderMenu(false);
  }, [selectedFolder]);

  const handleFolderMenuDelete = useCallback(async () => {
    if (!selectedFolder) return;
    setIsVisibleFolderMenu(false);

    try {
      const response = await api.get<{ questionSetCount: number }>(
        `/common-folders/${selectedFolder.id}/delete-warning`,
      );

      const questionSetCount = response.data.questionSetCount;
      const confirmMessage =
        questionSetCount > 0
          ? `'${selectedFolder.name}' 폴더에 ${questionSetCount}개의 오답노트가 있습니다.\n정말로 삭제하시겠습니까?`
          : `'${selectedFolder.name}' 폴더를 정말 삭제하시겠습니까?`;

      if (window.confirm(confirmMessage)) {
        deleteFolderMutation.mutate(selectedFolder.id);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`폴더 삭제 경고 정보를 가져오는데 실패했습니다: ${errorMessage}`);
    }
  }, [selectedFolder, deleteFolderMutation]);

  const submitFolderNameEdit = (folder: Folder) => {
    updateFolderNameMutation.mutate({
      id: folder.id,
      name: editingFolderName,
    });
  };

  const handleMenuDelete = useCallback(() => {
    if (!selectedItem) return;
    if (
      window.confirm(
        `'${selectedItem.questionSetTitle}' 오답노트를 정말 삭제하시겠습니까?`,
      )
    ) {
      deleteWrongNoteMutation.mutate(selectedItem.questionSetId);
    }
    setIsVisibleMenu(false);
  }, [selectedItem, deleteWrongNoteMutation]);

  const handleMenuReview = useCallback(() => {
    if (!selectedItem) return;
    navigate(`/solve/${selectedItem.questionSetId}?isReviewing=true`);
    setIsVisibleMenu(false);
  }, [selectedItem, navigate]);

  const handleMenuMoveToFolder = useCallback(
    (folderId: number) => {
      if (!selectedItem) return;
      moveFolderMutation.mutate({
        questionSetId: selectedItem.questionSetId,
        folderId: folderId,
      });
      setIsVisibleMenu(false);
    },
    [selectedItem, moveFolderMutation],
  );

  if (isPending || isFoldersPending) return <Spinner />;
  if (error) return <h1>Error</h1>;

  return (
    <WrongWrapper>
      <ContentWrapper>
        <RightClickMenu
          isVisible={isVisibleFolderMenu}
          setIsVisible={setIsVisibleFolderMenu}
          point={folderMousePoint}
        >
          <RightClickMenuItem
            icon="✏️"
            title="폴더 이름 변경"
            onClick={handleFolderMenuRename}
            disabled={selectedFolder?.id === ALL_FOLDER_ID}
          />
          <RightClickMenuItem
            icon="❌"
            title="폴더 삭제"
            onClick={handleFolderMenuDelete}
            disabled={selectedFolder?.id === ALL_FOLDER_ID}
          />
        </RightClickMenu>

        <RightClickMenu
          isVisible={isVisibleMenu}
          setIsVisible={setIsVisibleMenu}
          point={mousePoint}
        >
          <RightClickMenuItem
            icon="❌"
            title="삭제"
            onClick={handleMenuDelete}
          />
          <RightClickMenuDivider />
          {folders && folders.length > 0 && (
            <>
              <FolderSelectWrapper>
                <FolderSelectLabel>📁 폴더 이동</FolderSelectLabel>
                <FolderSelect
                  defaultValue={selectedFolderId ?? ''}
                  onChange={(e) => {
                    const targetFolderId = Number(e.target.value);
                    if (targetFolderId !== selectedFolderId) {
                      handleMenuMoveToFolder(targetFolderId);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </FolderSelect>
              </FolderSelectWrapper>
              <RightClickMenuDivider />
            </>
          )}
          <RightClickMenuItem
            icon="📝"
            title="복습하기"
            onClick={handleMenuReview}
          />
        </RightClickMenu>

        <WrongPageTitleWrapper>
          <WrongPageTitle>오답노트</WrongPageTitle>
        </WrongPageTitleWrapper>
        <WrongPageDescription>
          문제집별로 틀린 문제를 분석하고 완벽히 이해할 때까지 학습하세요
        </WrongPageDescription>
        <SearchBarWrapper>
          <SearchBarDescription>
            {filteredQuestionSets?.length}개의 오답이 검색되었습니다
          </SearchBarDescription>
          <SearchBar
            placeholder="오답노트 제목으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBarWrapper>
        <FolderContainer>
          {folders &&
            folders.map((folder) => {
              const colors = getFolderColor(folder.id);
              const isEditingThisFolder = editingFolderId === folder.id;
              return (
                <FolderTag
                  key={folder.id}
                  isDragOver={dragOverFolderId === folder.id}
                  isActive={selectedFolderId === folder.id}
                  folderColor={colors.bg}
                  folderHoverColor={colors.hover}
                  onClick={() => handleFolderClick(folder.id)}
                  onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder)}
                >
                  {isEditingThisFolder ? (
                    <>
                      📁{' '}
                      <FolderInput
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            submitFolderNameEdit(folder);
                          }
                          if (e.key === 'Escape') {
                            setEditingFolderId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <FolderActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          submitFolderNameEdit(folder);
                        }}
                      >
                        ✔️
                      </FolderActionButton>
                      <FolderActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(null);
                        }}
                      >
                        ❌
                      </FolderActionButton>
                    </>
                  ) : (
                    <>📁 {folder.name}</>
                  )}
                </FolderTag>
              );
            })}
          {isAddingFolder ? (
            <FolderInputContainer>
              <span>📁</span>
              <FolderInput
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmAddFolder();
                  }
                  if (e.key === 'Escape') {
                    handleCancelAddFolder();
                  }
                }}
                placeholder="폴더 이름"
                autoFocus
              />
              <FolderActionButton onClick={handleConfirmAddFolder}>
                ✔️
              </FolderActionButton>
              <FolderActionButton onClick={handleCancelAddFolder}>
                ❌
              </FolderActionButton>
            </FolderInputContainer>
          ) : (
            <AddFolderButton onClick={handleAddFolder}>➕</AddFolderButton>
          )}
        </FolderContainer>
        <WrongNoteList>
          <WrongNoteListHeader>
            <WrongNoteListHeaderColumn>문제집</WrongNoteListHeaderColumn>
            <WrongNoteListHeaderColumn>오답 수</WrongNoteListHeaderColumn>
            <WrongNoteListHeaderColumn>난이도</WrongNoteListHeaderColumn>
            <WrongNoteListHeaderColumn>카테고리</WrongNoteListHeaderColumn>
            <WrongNoteListHeaderColumn>작업</WrongNoteListHeaderColumn>
          </WrongNoteListHeader>
          {filteredQuestionSets?.map((item) => (
            <WrongNoteListItem
              key={item.questionSetId}
              item={item}
              draggable={true}
              onDragStart={(e: React.DragEvent<HTMLDivElement>) =>
                handleDragStart(e, item)
              }
              onDragEnd={handleDragEnd}
              isDragging={draggedItem?.questionSetId === item.questionSetId}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) =>
                handleContextMenu(e, item)
              }
            />
          ))}
        </WrongNoteList>
      </ContentWrapper>
    </WrongWrapper>
  );
}

export default Wrong;